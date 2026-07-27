import { useEffect, useRef, type ReactNode } from "react";

import { prefersReducedMotion } from "@/lib/motion";

/**
 * Rim light that tracks the cursor around a button's edge.
 *
 * Adapted from React Bits. Rendered as a rounded-rectangle signed distance
 * field so the highlight follows the exact CSS border rather than an
 * approximation of it, and fades in with proximity so the button is lit only
 * when someone is on their way to it.
 *
 * Applied to one control on the page. A specular rim on every button would be
 * decoration; on the single primary action it is a cue about where to go.
 */

const PAD = 20;

type OglParts = Pick<typeof import("ogl"), "Color" | "Mesh" | "Program" | "Renderer" | "Triangle">;

const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = sdRoundedRect(p, uHalfSize, uRadius);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`;

export default function SpecularButton({
  children,
  href,
  className,
  radius = 999,
  lineColor = "#8ec5ff",
  baseColor = "#0148e4",
  proximity = 260,
  ...rest
}: {
  children: ReactNode;
  href?: string;
  className?: string;
  radius?: number;
  lineColor?: string;
  baseColor?: string;
  proximity?: number;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const hostRef = useRef<HTMLAnchorElement>(null);
  const fxRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const fx = fxRef.current;
    if (!host || !fx || prefersReducedMotion()) return;
    // The rim tracks a cursor. Without one it would spin up a WebGL context to
    // render nothing, which on a phone is battery spent on an invisible effect.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    // ogl is imported here rather than at module scope so the anchor itself
    // stays in the entry bundle while the renderer does not. The button is
    // content and has to paint immediately; its rim light is not.
    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import("ogl")
      .then(({ Color, Mesh, Program, Renderer, Triangle }) => {
        if (cancelled) return;
        dispose = start(host, fx, { Color, Mesh, Program, Renderer, Triangle });
      })
      // The button works without its rim light; a failed chunk must not
      // surface as an error on a working call to action.
      .catch(() => {});
    return () => {
      cancelled = true;
      dispose?.();
    };

    function start(
      host: HTMLAnchorElement,
      fx: HTMLSpanElement,
      { Color, Mesh, Program, Renderer, Triangle }: OglParts,
    ) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        dpr,
      });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const geometry = new Triangle(gl);
      if (geometry.attributes.uv) delete geometry.attributes.uv;

      const program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uCenter: { value: [0, 0] },
          uHalfSize: { value: [1, 1] },
          uRadius: { value: 0 },
          uAngle: { value: 2.4 },
          uPx: { value: dpr },
          uLineColor: { value: [1, 1, 1] },
          uBaseColor: { value: [0.32, 0.32, 0.32] },
          uIntensity: { value: 0 },
          uShineSize: { value: 0.17 },
          uShineFade: { value: 0.7 },
          uThickness: { value: dpr },
          uBaseWidth: { value: dpr },
        },
      });
      const mesh = new Mesh(gl, { geometry, program });
      fx.appendChild(gl.canvas);

      const size = { w: 1, h: 1 };
      const resize = () => {
        // Measured fractionally and centred explicitly: rounding to offsetWidth
        // drifts the field up to a pixel off the CSS border it is tracing.
        const rect = host.getBoundingClientRect();
        size.w = rect.width;
        size.h = rect.height;
        renderer.setSize(rect.width + PAD * 2, rect.height + PAD * 2);
        program.uniforms.uCenter.value = [
          (PAD + rect.width / 2) * dpr,
          (PAD + rect.height / 2) * dpr,
        ];
        program.uniforms.uHalfSize.value = [(rect.width / 2) * dpr, (rect.height / 2) * dpr];
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();

      let pointerAngle: number | null = null;
      let proximityT = 0;
      const onPointerMove = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
        const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
        const distance = Math.hypot(dx, dy);
        if (distance === 0) {
          const nx = (event.clientX - cx) / (rect.width / 2);
          const ny = (cy - event.clientY) / (rect.height / 2);
          pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
        } else {
          pointerAngle = Math.atan2(cy - event.clientY, event.clientX - cx);
        }
        const t = Math.max(0, 1 - distance / Math.max(proximity, 1));
        proximityT = t * t * (3 - 2 * t);
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      const lineC = new Color();
      const baseC = new Color();
      let angle = 2.4;
      let idleAngle = 2.4;
      let bright = 0;
      let last = performance.now();
      let raf = 0;

      const update = (now: number) => {
        raf = requestAnimationFrame(update);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        idleAngle += 0.35 * dt;
        const target = pointerAngle ?? idleAngle;
        const diff = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        angle += diff * (1 - Math.exp(-dt * 7));
        bright += (proximityT - bright) * (1 - Math.exp(-dt * 8));

        // Nothing to light and nothing moving: stop submitting frames.
        if (bright < 0.002 && proximityT < 0.002) {
          cancelAnimationFrame(raf);
          raf = 0;
          program.uniforms.uIntensity.value = 0;
          renderer.render({ scene: mesh });
          return;
        }

        lineC.set(lineColor);
        baseC.set(baseColor);
        program.uniforms.uAngle.value = angle;
        program.uniforms.uRadius.value = Math.min(radius, Math.min(size.w, size.h) / 2) * dpr;
        program.uniforms.uLineColor.value = [lineC.r, lineC.g, lineC.b];
        program.uniforms.uBaseColor.value = [baseC.r, baseC.g, baseC.b];
        program.uniforms.uIntensity.value = bright;
        renderer.render({ scene: mesh });
      };

      const wake = () => {
        if (!raf) {
          last = performance.now();
          raf = requestAnimationFrame(update);
        }
      };
      window.addEventListener("pointermove", wake, { passive: true });
      wake();

      return () => {
        if (raf) cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointermove", wake);
        if (gl.canvas.parentNode === fx) fx.removeChild(gl.canvas);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }
  }, [radius, lineColor, baseColor, proximity]);

  return (
    <a ref={hostRef} href={href} className={className} {...rest}>
      <span ref={fxRef} className="specular-fx" aria-hidden />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </a>
  );
}
