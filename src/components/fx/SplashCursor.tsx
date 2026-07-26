import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

import {
  ADVECTION_SHADER,
  BASE_VERTEX,
  CLEAR_SHADER,
  CURL_SHADER,
  DISPLAY_SHADER,
  DIVERGENCE_SHADER,
  GRADIENT_SUBTRACT_SHADER,
  PRESSURE_SHADER,
  SPLAT_SHADER,
  VORTICITY_SHADER,
} from "./splash-shaders";

/**
 * Navier-Stokes fluid trailing the cursor.
 *
 * Adapted from Pavel Dobryakov's WebGL-Fluid-Simulation (MIT) via React Bits.
 * The simulation is untouched; what changed here is the colour and the
 * conditions under which it runs at all.
 *
 * The upstream component cycles random rainbow hues, which would be the one
 * thing on this page picking colours for decoration. The app encodes direction
 * in colour — an outbound turn is blue, the reply is green — so the trail
 * cycles that pair instead. Dragging the cursor across the page pulls the same
 * two colours through each other that a translation does.
 */

/** Dye is added additively every frame, so stops are dim by design. */
const TRAIL = [
  { r: 0.012, g: 0.078, b: 0.19 }, // cyan, the outbound voice
  { r: 0.021, g: 0.106, b: 0.075 }, // emerald, the reply
  { r: 0.004, g: 0.043, b: 0.153 }, // indigo, the depth between them
];

const CONFIG = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  DENSITY_DISSIPATION: 4.2,
  VELOCITY_DISSIPATION: 2.4,
  PRESSURE: 0.1,
  PRESSURE_ITERATIONS: 20,
  CURL: 2.4,
  SPLAT_RADIUS: 0.16,
  SPLAT_FORCE: 5200,
  SHADING: true,
};

type Pointer = {
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  moved: boolean;
  color: { r: number; g: number; b: number };
};

export default function SplashCursor() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // A pointer-trail effect has nothing to say on a touch screen, and a fluid
    // solver is the last thing a phone's battery needs. Reduced motion rules it
    // out outright.
    if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;

    // The canvas is created here rather than rendered by React, because
    // teardown calls loseContext() to hand the GPU memory back. A lost context
    // belongs to the canvas element forever: reusing the same node on a
    // remount — which React does on every StrictMode double-invoke — hands
    // back the dead context, and every call on it silently fails. A fresh
    // element per mount is the only way to make the effect re-runnable.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none";
    host.appendChild(canvas);

    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };
    const gl2 = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null;
    const gl = (gl2 ??
      canvas.getContext("webgl", params) ??
      canvas.getContext("experimental-webgl", params)) as WebGL2RenderingContext | null;
    if (!gl) return;
    const isWebGL2 = Boolean(gl2);

    let halfFloat: OES_texture_half_float | null = null;
    let supportLinearFiltering: unknown;
    if (isWebGL2) {
      gl.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
    } else {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
    }
    gl.clearColor(0, 0, 0, 1);

    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat?.HALF_FLOAT_OES;

    function supportRenderTextureFormat(internalFormat: number, format: number, type: number) {
      const texture = gl!.createTexture();
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = gl!.createFramebuffer();
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
      return gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) === gl!.FRAMEBUFFER_COMPLETE;
    }

    function getSupportedFormat(
      internalFormat: number,
      format: number,
      type: number,
    ): { internalFormat: number; format: number } | null {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        switch (internalFormat) {
          case gl!.R16F:
            return getSupportedFormat(gl!.RG16F, gl!.RG, type);
          case gl!.RG16F:
            return getSupportedFormat(gl!.RGBA16F, gl!.RGBA, type);
          default:
            return null;
        }
      }
      return { internalFormat, format };
    }

    const texType = halfFloatTexType as number;
    const formatRGBA = isWebGL2
      ? getSupportedFormat(gl.RGBA16F, gl.RGBA, texType)
      : getSupportedFormat(gl.RGBA, gl.RGBA, texType);
    const formatRG = isWebGL2
      ? getSupportedFormat(gl.RG16F, gl.RG, texType)
      : getSupportedFormat(gl.RGBA, gl.RGBA, texType);
    const formatR = isWebGL2
      ? getSupportedFormat(gl.R16F, gl.RED, texType)
      : getSupportedFormat(gl.RGBA, gl.RGBA, texType);
    if (!formatRGBA || !formatRG || !formatR) return;

    const dyeResolution = supportLinearFiltering ? CONFIG.DYE_RESOLUTION : 256;
    const shading = CONFIG.SHADING && Boolean(supportLinearFiltering);

    function compileShader(type: number, source: string, keywords?: string[]) {
      const withKeywords = keywords
        ? keywords.map((k) => `#define ${k}\n`).join("") + source
        : source;
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, withKeywords);
      gl!.compileShader(shader);
      return shader;
    }

    function createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
      const program = gl!.createProgram()!;
      gl!.attachShader(program, vertexShader);
      gl!.attachShader(program, fragmentShader);
      gl!.linkProgram(program);
      return program;
    }

    function getUniforms(program: WebGLProgram) {
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const count = gl!.getProgramParameter(program, gl!.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const name = gl!.getActiveUniform(program, i)!.name;
        uniforms[name] = gl!.getUniformLocation(program, name);
      }
      return uniforms;
    }

    class Program {
      program: WebGLProgram;
      uniforms: Record<string, WebGLUniformLocation | null>;
      constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
      }
      bind() {
        gl!.useProgram(this.program);
      }
    }

    const baseVertexShader = compileShader(gl.VERTEX_SHADER, BASE_VERTEX);
    const clearProgram = new Program(
      baseVertexShader,
      compileShader(gl.FRAGMENT_SHADER, CLEAR_SHADER),
    );
    const splatProgram = new Program(
      baseVertexShader,
      compileShader(gl.FRAGMENT_SHADER, SPLAT_SHADER),
    );
    const advectionProgram = new Program(
      baseVertexShader,
      compileShader(
        gl.FRAGMENT_SHADER,
        ADVECTION_SHADER,
        supportLinearFiltering ? undefined : ["MANUAL_FILTERING"],
      ),
    );
    const divergenceProgram = new Program(
      baseVertexShader,
      compileShader(gl.FRAGMENT_SHADER, DIVERGENCE_SHADER),
    );
    const curlProgram = new Program(
      baseVertexShader,
      compileShader(gl.FRAGMENT_SHADER, CURL_SHADER),
    );
    const vorticityProgram = new Program(
      baseVertexShader,
      compileShader(gl.FRAGMENT_SHADER, VORTICITY_SHADER),
    );
    const pressureProgram = new Program(
      baseVertexShader,
      compileShader(gl.FRAGMENT_SHADER, PRESSURE_SHADER),
    );
    const gradientSubtractProgram = new Program(
      baseVertexShader,
      compileShader(gl.FRAGMENT_SHADER, GRADIENT_SUBTRACT_SHADER),
    );
    const displayProgram = new Program(
      baseVertexShader,
      compileShader(gl.FRAGMENT_SHADER, DISPLAY_SHADER, shading ? ["SHADING"] : undefined),
    );

    const blit = (() => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
        gl.STATIC_DRAW,
      );
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      return (target: FBO | null) => {
        if (!target) {
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
          gl.viewport(0, 0, target.width, target.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      };
    })();

    type FBO = ReturnType<typeof createFBO>;

    function createFBO(
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ) {
      gl!.activeTexture(gl!.TEXTURE0);
      const texture = gl!.createTexture();
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, param);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, param);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      const fbo = gl!.createFramebuffer();
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
      gl!.viewport(0, 0, w, h);
      gl!.clear(gl!.COLOR_BUFFER_BIT);

      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1 / w,
        texelSizeY: 1 / h,
        attach(id: number) {
          gl!.activeTexture(gl!.TEXTURE0 + id);
          gl!.bindTexture(gl!.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    function createDoubleFBO(
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
          return fbo1;
        },
        set read(v: FBO) {
          fbo1 = v;
        },
        get write() {
          return fbo2;
        },
        set write(v: FBO) {
          fbo2 = v;
        },
        swap() {
          const temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        },
      };
    }

    function getResolution(resolution: number) {
      let aspectRatio = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1 / aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);
      return gl!.drawingBufferWidth > gl!.drawingBufferHeight
        ? { width: max, height: min }
        : { width: min, height: max };
    }

    let dye: ReturnType<typeof createDoubleFBO>;
    let velocity: ReturnType<typeof createDoubleFBO>;
    let divergence: FBO;
    let curl: FBO;
    let pressure: ReturnType<typeof createDoubleFBO>;

    function initFramebuffers() {
      const simRes = getResolution(CONFIG.SIM_RESOLUTION);
      const dyeRes = getResolution(dyeResolution);
      const filtering = supportLinearFiltering ? gl!.LINEAR : gl!.NEAREST;
      gl!.disable(gl!.BLEND);

      dye = createDoubleFBO(
        dyeRes.width,
        dyeRes.height,
        formatRGBA!.internalFormat,
        formatRGBA!.format,
        texType,
        filtering,
      );
      velocity = createDoubleFBO(
        simRes.width,
        simRes.height,
        formatRG!.internalFormat,
        formatRG!.format,
        texType,
        filtering,
      );
      divergence = createFBO(
        simRes.width,
        simRes.height,
        formatR!.internalFormat,
        formatR!.format,
        texType,
        gl!.NEAREST,
      );
      curl = createFBO(
        simRes.width,
        simRes.height,
        formatR!.internalFormat,
        formatR!.format,
        texType,
        gl!.NEAREST,
      );
      pressure = createDoubleFBO(
        simRes.width,
        simRes.height,
        formatR!.internalFormat,
        formatR!.format,
        texType,
        gl!.NEAREST,
      );
    }

    const scaleByPixelRatio = (input: number) => Math.floor(input * (window.devicePixelRatio || 1));

    function resizeCanvas() {
      const width = scaleByPixelRatio(canvas!.clientWidth);
      const height = scaleByPixelRatio(canvas!.clientHeight);
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
        return true;
      }
      return false;
    }

    resizeCanvas();
    initFramebuffers();

    const pointer: Pointer = {
      texcoordX: 0,
      texcoordY: 0,
      prevTexcoordX: 0,
      prevTexcoordY: 0,
      deltaX: 0,
      deltaY: 0,
      moved: false,
      color: TRAIL[0],
    };
    let trailIndex = 0;
    let colorTimer = 0;

    function correctRadius(radius: number) {
      const aspectRatio = canvas!.width / canvas!.height;
      return aspectRatio > 1 ? radius * aspectRatio : radius;
    }

    function splat(x: number, y: number, dx: number, dy: number, color: Pointer["color"]) {
      splatProgram.bind();
      gl!.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl!.uniform1f(splatProgram.uniforms.aspectRatio, canvas!.width / canvas!.height);
      gl!.uniform2f(splatProgram.uniforms.point, x, y);
      gl!.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
      gl!.uniform1f(splatProgram.uniforms.radius, correctRadius(CONFIG.SPLAT_RADIUS / 100));
      blit(velocity.write);
      velocity.swap();

      gl!.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      gl!.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    function step(dt: number) {
      gl!.disable(gl!.BLEND);

      curlProgram.bind();
      gl!.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      vorticityProgram.bind();
      gl!.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl!.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      gl!.uniform1f(vorticityProgram.uniforms.curl, CONFIG.CURL);
      gl!.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      gl!.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      gl!.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
      gl!.uniform1f(clearProgram.uniforms.value, CONFIG.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      pressureProgram.bind();
      gl!.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
        gl!.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gradientSubtractProgram.bind();
      gl!.uniform2f(
        gradientSubtractProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
      gl!.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
      gl!.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      gl!.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!supportLinearFiltering) {
        gl!.uniform2f(
          advectionProgram.uniforms.dyeTexelSize,
          velocity.texelSizeX,
          velocity.texelSizeY,
        );
      }
      const velocityId = velocity.read.attach(0);
      gl!.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
      gl!.uniform1i(advectionProgram.uniforms.uSource, velocityId);
      gl!.uniform1f(advectionProgram.uniforms.dt, dt);
      gl!.uniform1f(advectionProgram.uniforms.dissipation, CONFIG.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      if (!supportLinearFiltering) {
        gl!.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      }
      gl!.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl!.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      gl!.uniform1f(advectionProgram.uniforms.dissipation, CONFIG.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    function render() {
      gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.enable(gl!.BLEND);
      displayProgram.bind();
      if (shading) {
        gl!.uniform2f(
          displayProgram.uniforms.texelSize,
          1 / gl!.drawingBufferWidth,
          1 / gl!.drawingBufferHeight,
        );
      }
      gl!.uniform1i(displayProgram.uniforms.uTexture, dye.read.attach(0));
      blit(null);
    }

    let lastUpdate = performance.now();
    let raf = 0;
    let running = true;

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!running) return;

      const now = performance.now();
      const dt = Math.min((now - lastUpdate) / 1000, 0.016666);
      lastUpdate = now;

      if (resizeCanvas()) initFramebuffers();

      colorTimer += dt;
      if (colorTimer > 0.35) {
        colorTimer = 0;
        trailIndex = (trailIndex + 1) % TRAIL.length;
      }

      if (pointer.moved) {
        pointer.moved = false;
        splat(
          pointer.texcoordX,
          pointer.texcoordY,
          pointer.deltaX * CONFIG.SPLAT_FORCE,
          pointer.deltaY * CONFIG.SPLAT_FORCE,
          pointer.color,
        );
      }
      step(dt);
      render();
    }
    frame();

    const correctDeltaX = (delta: number) => {
      const aspectRatio = canvas.width / canvas.height;
      return aspectRatio < 1 ? delta * aspectRatio : delta;
    };
    const correctDeltaY = (delta: number) => {
      const aspectRatio = canvas.width / canvas.height;
      return aspectRatio > 1 ? delta / aspectRatio : delta;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const posX = scaleByPixelRatio(event.clientX);
      const posY = scaleByPixelRatio(event.clientY);
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1 - posY / canvas.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
      pointer.color = TRAIL[trailIndex];
    };

    // A GPU simulation running against a hidden tab is pure waste, and the
    // first frame back would integrate the whole elapsed gap at once.
    const onVisibility = () => {
      running = !document.hidden;
      lastUpdate = performance.now();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className="pointer-events-none fixed inset-0 z-0" />;
}
