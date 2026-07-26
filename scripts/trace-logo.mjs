/**
 * Traces the Uktam mandala from its raster export into an SVG.
 *
 * The mark is not something to redraw by hand: it is 8-fold symmetric in shape
 * but every petal carries its own gradient, and the purple kites are partly
 * transparent so they tint whatever sits behind them. A hand-authored
 * approximation would be a different logo. So this reads the actual pixels,
 * segments them into the shapes they were drawn as, and fits each one's real
 * gradient.
 *
 * Regions are disjoint by construction, so the flattened RGBA at any pixel is
 * exactly what the original composites to — reproducing them side by side
 * reproduces the source, including its translucency over any backdrop.
 *
 *   bun scripts/trace-logo.mjs
 */
import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

import { decodePng } from "./lib/png-decode.mjs";
import {
  loopArea,
  detectAnchors,
  loopToPath,
  segmentByEdges,
  simplifyLoop,
  smoothLoop,
  traceLoops,
} from "./lib/raster-trace.mjs";

const SOURCE = "public/brand/logo-512.png";
const OUTPUT = "public/brand/mandala.svg";

const EDGE_THRESHOLD = 5;
const MIN_SEED_PX = 12;
/**
 * Simplification tolerance scales with feature size.
 *
 * One global tolerance cannot serve both a 100px petal and a 12px waveform
 * bar: the value that keeps the petals compact erases the bars. Tolerance is
 * therefore a fraction of each region's own scale, floored so fine detail
 * stays intact and capped so a large smooth shape doesn't go polygonal.
 */
const RDP_MIN = 0.5;
const RDP_MAX = 2.2;
const RDP_SCALE = 60;
const epsilonFor = (area) =>
  Math.max(RDP_MIN, Math.min(RDP_MAX, RDP_MIN + Math.sqrt(area) / RDP_SCALE));

/**
 * Contour denoising and corner preservation. See raster-trace.mjs for why.
 *
 * The span over which curvature is measured has to scale with the shape too. A
 * fixed 4px span reads the entire rounded cap of a 12px waveform bar as one
 * long corner, which freezes the staircase noise in place and tears the end
 * off; the same span is exactly right for finding the tip of a 100px petal.
 */
const CORNER_ANGLE = 1.2;
const cornerSpanFor = (area) => Math.max(3, Math.min(6, Math.round(Math.sqrt(area) / 12)));
const SMOOTH_PASSES = 2;
const SMOOTH_WINDOW = 2;
const CURVE_TENSION = 1;

/**
 * Hairline stroke in each region's own paint, instead of growing its mask.
 *
 * Adjacent regions trace the same pixel boundary, but each simplifies it
 * independently — opposite winding, different start vertex — so the two curves
 * drift apart by a fraction of a pixel and the artwork behind shows through the
 * gap. Growing the mask by a whole pixel closes that gap but costs a whole
 * pixel, which on a 13px waveform bar is a sixth of its width.
 *
 * A stroke splits the difference across the boundary instead: it pushes a fill
 * out by half its width and pulls a hole in by the same, so overlapping the
 * seam costs a fraction of a pixel rather than two. Fill and stroke do
 * double-composite where they overlap, but only over a sub-pixel band.
 */
const SEAM_STROKE = 0.6;
/** Below this much colour travel across a region, a gradient isn't earning its bytes. */
const FLAT_THRESHOLD = 6;

const { w, h, data } = decodePng(SOURCE);
const { labels, isSeed, seeds, edgePixels } = segmentByEdges(data, w, h, {
  edgeThreshold: EDGE_THRESHOLD,
  minSeed: MIN_SEED_PX,
});
console.log(`source ${SOURCE} ${w}x${h}`);
console.log(`${seeds} smooth seeds, ${edgePixels} edge pixels flooded back`);

const byLabel = new Map();
for (let p = 0; p < w * h; p++) {
  const id = labels[p];
  if (id === -1) continue;
  let entry = byLabel.get(id);
  if (!entry) byLabel.set(id, (entry = { all: [], seed: [] }));
  entry.all.push(p);
  if (isSeed[p]) entry.seed.push(p);
}
const regions = [...byLabel.values()].filter((r) => r.seed.length >= MIN_SEED_PX);
console.log(`${regions.length} regions to trace`);

/**
 * Least-squares plane per channel, collapsed to one gradient axis.
 *
 * Fitting each channel independently gives four directions; the artwork only
 * has one, so they're averaged weighted by how much each channel actually
 * travels. Pixels are then projected onto that axis to find the endpoints, and
 * the fitted planes are evaluated there to get the stop colours.
 */
function fitGradient(pixels) {
  const n = pixels.length;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of pixels) {
    const x = p % w;
    const y = (p / w) | 0;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const mx = sx / n;
  const my = sy / n;
  const cxx = sxx / n - mx * mx;
  const cyy = syy / n - my * my;
  const cxy = sxy / n - mx * my;
  const det = cxx * cyy - cxy * cxy;

  const planes = [];
  const mean = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    let sv = 0;
    let sxv = 0;
    let syv = 0;
    for (const p of pixels) {
      const v = data[p * 4 + c];
      sv += v;
      sxv += (p % w) * v;
      syv += ((p / w) | 0) * v;
    }
    const mv = sv / n;
    mean[c] = mv;
    if (Math.abs(det) < 1e-6) {
      planes.push([0, 0, mv]);
      continue;
    }
    const cxv = sxv / n - mx * mv;
    const cyv = syv / n - my * mv;
    const a = (cxv * cyy - cyv * cxy) / det;
    const b = (cyv * cxx - cxv * cxy) / det;
    planes.push([a, b, mv - a * mx - b * my]);
  }

  // Residual of the linear model, so a region a gradient cannot describe is
  // visible in the log rather than silently wrong in the output.
  let sq = 0;
  for (const p of pixels) {
    const x = p % w;
    const y = (p / w) | 0;
    for (let c = 0; c < 4; c++) {
      const [a, b, c0] = planes[c];
      sq += (a * x + b * y + c0 - data[p * 4 + c]) ** 2;
    }
  }
  const residual = Math.sqrt(sq / (n * 4));

  let dx = 0;
  let dy = 0;
  for (const [a, b] of planes) {
    const mag = Math.hypot(a, b);
    dx += a * mag;
    dy += b * mag;
  }
  if (Math.hypot(dx, dy) < 1e-9) return { flat: true, color: mean, residual };
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;

  let lo = Infinity;
  let hi = -Infinity;
  for (const p of pixels) {
    const t = (p % w) * dx + ((p / w) | 0) * dy;
    if (t < lo) lo = t;
    if (t > hi) hi = t;
  }
  const tc = mx * dx + my * dy;
  const pointAt = (t) => [mx + (t - tc) * dx, my + (t - tc) * dy];
  const colorAt = (t) => {
    const [px, py] = pointAt(t);
    return planes.map(([a, b, c0]) => a * px + b * py + c0);
  };

  const from = colorAt(lo);
  const to = colorAt(hi);
  const travel = Math.max(...from.map((v, i) => Math.abs(v - to[i])));
  if (travel < FLAT_THRESHOLD) return { flat: true, color: mean, residual };

  const [x1, y1] = pointAt(lo);
  const [x2, y2] = pointAt(hi);
  return { flat: false, from, to, x1, y1, x2, y2, residual };
}

const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
const rgb = (c) =>
  `#${c
    .slice(0, 3)
    .map((v) => clamp255(v).toString(16).padStart(2, "0"))
    .join("")}`;
const alpha = (c) => Number((Math.max(0, Math.min(255, c[3])) / 255).toFixed(3));
const num = (v) => Number(v.toFixed(1));

// Membership lookup that also lets a region borrow one pixel of its neighbours.
// Independently simplified curves diverge by fractions of a pixel along a
// shared edge, and an antialiasing renderer shows that as a bright seam. The
// dilation only ever grows into other opaque regions, so the outer silhouette
// keeps its traced position.
const shapes = [];
regions.forEach(({ all: pixels, seed }) => {
  const grown = new Uint8Array(w * h);
  for (const p of pixels) grown[p] = 1;

  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && grown[y * w + x] === 1;
  const d = traceLoops(inside, w, h)
    .map((loop) => {
      // Scale is a property of the loop, not of the region that owns it. The
      // teal disc is the largest region in the mark, but the holes punched in
      // it are the waveform bars — among the smallest features. Sizing those
      // holes by the disc's area simplifies them into shapes wider than the
      // bars drawn over them, and the artwork underneath leaks out around
      // every bar.
      const area = Math.abs(loopArea(loop));
      const epsilon = epsilonFor(area);
      const cornerSpan = cornerSpanFor(area);
      // Corners are found on a lightly pre-smoothed copy. On the raw contour a
      // single staircase step turns 90 degrees, which is indistinguishable from
      // a real corner at any span short enough to localise one — and every
      // false corner becomes a cusp, which is what tears the ends off the
      // waveform bars. One averaging pass removes the step without moving a
      // genuine corner far enough to hide it.
      const prelim = smoothLoop(loop, null, { passes: 1, window: 1 });
      const anchors = detectAnchors(prelim, { span: cornerSpan, angle: CORNER_ANGLE });
      const denoised = smoothLoop(loop, anchors, { passes: SMOOTH_PASSES, window: SMOOTH_WINDOW });
      const simplified = simplifyLoop(denoised, epsilon, anchors);
      return loopToPath(simplified.points, {
        corners: simplified.anchors,
        smoothing: CURVE_TENSION,
        precision: 1,
      });
    })
    .join("");
  if (!d) return;

  shapes.push({ d, paint: fitGradient(seed), area: pixels.length });
});

// Larger shapes first so the one-pixel dilations are covered by the finer
// detail painted on top rather than the other way round.
shapes.sort((a, b) => b.area - a.area);

const worst = [...shapes].sort((a, b) => b.paint.residual - a.paint.residual).slice(0, 5);
console.log("worst linear-fit residuals (0-255 per channel):");
for (const s of worst) console.log(`  ${s.paint.residual.toFixed(2)}  over ${s.area}px`);

/**
 * Error of the colour model alone, evaluated without rendering anything.
 *
 * This deliberately ignores path simplification and measures only what
 * segmentation and gradient fitting got wrong, which is the part being tuned.
 * The rasterised check against the real SVG still has to happen afterwards.
 */
function reportModelError() {
  let sum = 0;
  let over8 = 0;
  let count = 0;
  for (const { seed: pixels } of regions) {
    const paint = fitGradient(pixels);
    const predict = paint.flat
      ? () => paint.color
      : (x, y) => {
          const dx = paint.x2 - paint.x1;
          const dy = paint.y2 - paint.y1;
          const len2 = dx * dx + dy * dy || 1;
          const t = Math.max(0, Math.min(1, ((x - paint.x1) * dx + (y - paint.y1) * dy) / len2));
          return paint.from.map((v, c) => v + (paint.to[c] - v) * t);
        };
    for (const p of pixels) {
      const x = p % w;
      const y = (p / w) | 0;
      const got = predict(x, y);
      let pixelWorst = 0;
      for (const bg of [0, 255]) {
        for (let c = 0; c < 3; c++) {
          const ref = (data[p * 4 + c] * data[p * 4 + 3] + bg * (255 - data[p * 4 + 3])) / 255;
          const mine = (got[c] * got[3] + bg * (255 - got[3])) / 255;
          const d = Math.abs(ref - mine);
          sum += d;
          count++;
          if (d > pixelWorst) pixelWorst = d;
        }
      }
      if (pixelWorst > 8) over8++;
    }
  }
  const totalPixels = regions.reduce((n, r) => n + r.seed.length, 0);
  console.log(
    `colour model: mae ${(sum / count).toFixed(2)}/255, ` +
      `${((over8 / totalPixels) * 100).toFixed(1)}% of interior pixels off by >8`,
  );
}
reportModelError();

const defs = [];
const body = [];
shapes.forEach((shape, i) => {
  const { paint } = shape;
  if (paint.flat) {
    const op = alpha(paint.color);
    const color = rgb(paint.color);
    const attrs = [`fill="${color}"`, `stroke="${color}"`];
    if (op < 0.999) attrs.push(`fill-opacity="${op}"`, `stroke-opacity="${op}"`);
    body.push(`<path ${attrs.join(" ")} d="${shape.d}"/>`);
    return;
  }
  const id = `u${i}`;
  const a1 = alpha(paint.from);
  const a2 = alpha(paint.to);
  defs.push(
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" ` +
      `x1="${num(paint.x1)}" y1="${num(paint.y1)}" x2="${num(paint.x2)}" y2="${num(paint.y2)}">` +
      `<stop stop-color="${rgb(paint.from)}"${a1 < 0.999 ? ` stop-opacity="${a1}"` : ""}/>` +
      `<stop offset="1" stop-color="${rgb(paint.to)}"${a2 < 0.999 ? ` stop-opacity="${a2}"` : ""}/>` +
      `</linearGradient>`,
  );
  body.push(`<path fill="url(#${id})" stroke="url(#${id})" d="${shape.d}"/>`);
});

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Uktam.ai" ` +
  `stroke-width="${SEAM_STROKE}">` +
  (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
  body.join("") +
  `</svg>\n`;

writeFileSync(OUTPUT, svg);
console.log(
  `wrote ${OUTPUT}: ${shapes.length} paths, ${defs.length} gradients, ` +
    `${(Buffer.byteLength(svg) / 1024).toFixed(1)} kB raw / ` +
    `${(gzipSync(svg).length / 1024).toFixed(1)} kB gz`,
);
