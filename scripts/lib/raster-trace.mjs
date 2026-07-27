/**
 * Raster-to-vector tracing primitives.
 *
 * The pipeline is: segment on colour discontinuities -> walk each region's
 * boundary -> denoise the contour -> simplify -> fit cubic curves. Every stage
 * works on flat typed arrays because the caller runs it over a few hundred
 * thousand pixels.
 */

/** Pixels below this alpha are treated as outside the artwork entirely. */
const ALPHA_CUTOFF = 128;

/**
 * Segment the artwork into the shapes it was actually drawn from.
 *
 * Quantizing colour is the wrong tool here: a smooth gradient across one petal
 * gets sliced into arbitrary bands that each need their own path, which is both
 * enormous and visibly hatched. What separates two real shapes is not colour
 * distance but a *discontinuity* — a white outline, an alpha step, a hard edge.
 * Inside a shape, colour crawls; across a boundary, it jumps.
 *
 * So: mark pixels where colour jumps, take the connected smooth areas between
 * them as seeds, and flood the thin edge pixels back to whichever seed reaches
 * them first. What comes out is a few dozen regions matching the drawing, each
 * of which a single gradient can describe.
 */
export function segmentByEdges(data, w, h, { edgeThreshold = 14, minSeed = 40 } = {}) {
  const opaque = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) opaque[p] = data[p * 4 + 3] >= ALPHA_CUTOFF ? 1 : 0;

  const isEdge = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (!opaque[p]) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (!opaque[q]) continue;
        let jump = 0;
        for (let c = 0; c < 4; c++) {
          const d = Math.abs(data[p * 4 + c] - data[q * 4 + c]);
          if (d > jump) jump = d;
        }
        if (jump > edgeThreshold) {
          isEdge[p] = 1;
          break;
        }
      }
    }
  }

  const labels = new Int32Array(w * h).fill(-1);
  const queue = new Int32Array(w * h);
  let next = 0;
  const seedSizes = [];

  for (let start = 0; start < w * h; start++) {
    if (labels[start] !== -1 || !opaque[start] || isEdge[start]) continue;
    const id = next++;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = id;
    let size = 0;
    while (head < tail) {
      const p = queue[head++];
      size++;
      const x = p % w;
      const y = (p / w) | 0;
      if (x > 0 && labels[p - 1] === -1 && opaque[p - 1] && !isEdge[p - 1])
        labels[(queue[tail++] = p - 1)] = id;
      if (x < w - 1 && labels[p + 1] === -1 && opaque[p + 1] && !isEdge[p + 1])
        labels[(queue[tail++] = p + 1)] = id;
      if (y > 0 && labels[p - w] === -1 && opaque[p - w] && !isEdge[p - w])
        labels[(queue[tail++] = p - w)] = id;
      if (y < h - 1 && labels[p + w] === -1 && opaque[p + w] && !isEdge[p + w])
        labels[(queue[tail++] = p + w)] = id;
    }
    seedSizes.push(size);
  }

  // Specks are edge noise, not shapes; release them to be flooded like edges.
  for (let p = 0; p < w * h; p++) {
    if (labels[p] !== -1 && seedSizes[labels[p]] < minSeed) labels[p] = -1;
  }

  // Multi-source BFS: the unlabelled edge band goes to whichever seed is
  // nearest, which puts the vector boundary down the middle of each seam.
  let head = 0;
  let tail = 0;
  for (let p = 0; p < w * h; p++) if (labels[p] !== -1) queue[tail++] = p;
  while (head < tail) {
    const p = queue[head++];
    const id = labels[p];
    const x = p % w;
    const y = (p / w) | 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const q = ny * w + nx;
      if (!opaque[q] || labels[q] !== -1) continue;
      labels[q] = id;
      queue[tail++] = q;
    }
  }

  // `isSeed` marks pixels that were smooth to begin with. Anti-aliased seam
  // pixels are blends of two neighbouring regions, so they belong to neither
  // one's gradient: including them both biases the fit and makes any error
  // metric measure the renderer's job rather than ours. They still need a
  // region for tracing, hence two masks rather than one.
  const isSeed = new Uint8Array(w * h);
  let edgePixels = 0;
  for (let p = 0; p < w * h; p++) {
    if (isEdge[p] || !opaque[p]) edgePixels += opaque[p];
    else isSeed[p] = 1;
  }
  return { labels, isSeed, seeds: next, edgePixels };
}

/**
 * Walk a region's boundary as closed loops of pixel-corner coordinates.
 *
 * Every inside pixel contributes a directed unit edge for each side facing
 * outside, wound so the region stays on the right. Head-to-tail chaining then
 * falls out for free, and outer loops come back clockwise while holes come back
 * counter-clockwise — exactly what the nonzero fill rule needs to punch holes
 * without any extra bookkeeping.
 */
export function traceLoops(inside, w, h) {
  const edges = new Map();
  const key = (x, y) => y * (w + 1) + x;

  const add = (x0, y0, x1, y1) => {
    const k = key(x0, y0);
    const list = edges.get(k);
    if (list) list.push([x1, y1]);
    else edges.set(k, [[x1, y1]]);
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      if (!inside(x, y - 1)) add(x, y, x + 1, y);
      if (!inside(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!inside(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!inside(x - 1, y)) add(x, y + 1, x, y);
    }
  }

  const loops = [];
  while (edges.size) {
    const startKey = edges.keys().next().value;
    let cx = startKey % (w + 1);
    let cy = (startKey / (w + 1)) | 0;
    const loop = [[cx, cy]];

    for (;;) {
      const list = edges.get(key(cx, cy));
      if (!list || !list.length) break;
      const [nx, ny] = list.pop();
      if (!list.length) edges.delete(key(cx, cy));
      cx = nx;
      cy = ny;
      if (cx === loop[0][0] && cy === loop[0][1]) break;
      loop.push([cx, cy]);
    }
    if (loop.length > 3) loops.push(loop);
  }
  return loops;
}

/** Signed area of a closed loop; the sign distinguishes outer contours from holes. */
export function loopArea(points) {
  let sum = 0;
  for (let i = 0, n = points.length; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

/**
 * Flag vertices that sit on a genuine corner rather than a quantization step.
 *
 * Curvature is measured across a span of several pixels, not between immediate
 * neighbours: at one-pixel range every staircase step looks like a 90-degree
 * corner, so the only way to tell a petal tip from a raster artefact is to
 * compare the direction of travel well before and well after the vertex.
 */
export function detectAnchors(points, { span = 4, angle = 1.0 } = {}) {
  const n = points.length;
  const anchors = new Uint8Array(n);
  if (n < span * 2 + 1) return anchors;
  for (let i = 0; i < n; i++) {
    const a = points[(i - span + n) % n];
    const b = points[i];
    const c = points[(i + span) % n];
    const before = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const after = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let turn = Math.abs(after - before);
    if (turn > Math.PI) turn = Math.PI * 2 - turn;
    if (turn > angle) anchors[i] = 1;
  }
  return anchors;
}

/**
 * Circular moving average that leaves anchored vertices where they are.
 *
 * A traced contour runs along pixel edges, so every diagonal is a staircase
 * whose treads are half a pixel off the true curve. Simplifying that directly
 * makes the tolerance pick noise peaks, and smoothing through those peaks is
 * what turns a circle into a scallop. Averaging first puts the vertices back on
 * the curve the pixels were approximating; holding the anchors fixed keeps the
 * corners from melting in the process.
 */
export function smoothLoop(points, anchors, { passes = 2, window = 2 } = {}) {
  const n = points.length;
  if (n < 5) return points;
  let current = points;
  for (let pass = 0; pass < passes; pass++) {
    const next = new Array(n);
    for (let i = 0; i < n; i++) {
      if (anchors && anchors[i]) {
        next[i] = current[i];
        continue;
      }
      let sx = 0;
      let sy = 0;
      let count = 0;
      for (let k = -window; k <= window; k++) {
        const p = current[(i + k + n) % n];
        sx += p[0];
        sy += p[1];
        count++;
      }
      next[i] = [sx / count, sy / count];
    }
    current = next;
  }
  return current;
}

/**
 * Ramer-Douglas-Peucker on a closed loop.
 *
 * `keep` marks vertices that must survive regardless of tolerance, so corner
 * anchors are never simplified away. Returns the surviving points alongside
 * their anchor flags, since the caller needs to know which of the remaining
 * vertices are corners when it builds curves.
 */
export function simplifyLoop(points, epsilon, keep) {
  if (points.length < 4) return { points, anchors: keep ?? new Uint8Array(points.length) };

  const perpendicular = (p, a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
  };

  const survive = new Uint8Array(points.length);
  survive[0] = 1;
  survive[points.length - 1] = 1;
  if (keep) for (let i = 0; i < points.length; i++) if (keep[i]) survive[i] = 1;

  // Recurse between consecutive fixed vertices rather than across the whole
  // loop, so an anchored corner splits the run instead of being measured as
  // deviation from a chord that cuts straight through it.
  const fixed = [];
  for (let i = 0; i < points.length; i++) if (survive[i]) fixed.push(i);
  const stack = [];
  for (let i = 0; i < fixed.length - 1; i++) stack.push([fixed[i], fixed[i + 1]]);

  while (stack.length) {
    const [lo, hi] = stack.pop();
    let worst = 0;
    let index = -1;
    for (let i = lo + 1; i < hi; i++) {
      const d = perpendicular(points[i], points[lo], points[hi]);
      if (d > worst) {
        worst = d;
        index = i;
      }
    }
    if (index !== -1 && worst > epsilon) {
      survive[index] = 1;
      stack.push([lo, index], [index, hi]);
    }
  }

  const out = [];
  const anchors = [];
  for (let i = 0; i < points.length; i++) {
    if (!survive[i]) continue;
    out.push(points[i]);
    anchors.push(keep && keep[i] ? 1 : 0);
  }
  return { points: out, anchors: Uint8Array.from(anchors) };
}

/**
 * Closed polygon -> cubic path, smoothing gentle bends but preserving corners.
 *
 * Catmull-Rom tangents round everything off, which is right for a petal's flank
 * and wrong for its tip. Vertices that turn harder than `cornerAngle` get a
 * zero tangent instead, pinning the curve to the vertex so tips stay sharp.
 */
export function loopToPath(points, { smoothing = 1, corners, precision = 2, minStep = 0.4 } = {}) {
  // Drop near-duplicate vertices first. Closing a loop leaves the first and
  // last points adjacent and often a fraction of a pixel apart, and such a
  // segment is the pathological case for the tangents below.
  if (points.length > 3) {
    const kept = [];
    const keptCorners = [];
    for (let i = 0; i < points.length; i++) {
      const prev = kept[kept.length - 1];
      if (prev && Math.hypot(points[i][0] - prev[0], points[i][1] - prev[1]) < minStep) {
        // Preserve a corner flag rather than losing it with the vertex.
        if (corners && corners[i]) keptCorners[keptCorners.length - 1] = 1;
        continue;
      }
      kept.push(points[i]);
      keptCorners.push(corners && corners[i] ? 1 : 0);
    }
    const first = kept[0];
    const last = kept[kept.length - 1];
    if (kept.length > 3 && Math.hypot(last[0] - first[0], last[1] - first[1]) < minStep) {
      kept.pop();
      keptCorners.pop();
    }
    points = kept;
    corners = keptCorners;
  }

  const n = points.length;
  if (n < 3) return "";
  const r = (v) => Number(v.toFixed(precision));

  // Corners come from the raw contour, where a wide span could still tell a
  // real vertex from a staircase step. Re-deriving them here would be measuring
  // the simplified polygon, whose every vertex turns sharply by construction.
  const isCorner = (i) => Boolean(corners && corners[i]);

  const tangent = (i) => {
    if (isCorner(i)) return [0, 0];
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    return [((next[0] - prev[0]) / 6) * smoothing, ((next[1] - prev[1]) / 6) * smoothing];
  };

  // A Catmull-Rom handle is sized from the neighbours' spacing, not the
  // segment's. Where a short segment sits between distant neighbours the two
  // handles reach past each other, and the cubic doubles back on itself — a
  // cusp, which is what tore the ends off the waveform bars. Capping each
  // handle at a third of its own segment is the standard no-overshoot bound
  // and leaves ordinary segments untouched.
  const capped = (t, length) => {
    const mag = Math.hypot(t[0], t[1]);
    const limit = length / 3;
    if (mag <= limit || mag === 0) return t;
    const k = limit / mag;
    return [t[0] * k, t[1] * k];
  };

  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const length = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const t1 = capped(tangent(i), length);
    const t2 = capped(tangent((i + 1) % n), length);
    d +=
      `C${r(p1[0] + t1[0])} ${r(p1[1] + t1[1])} ` +
      `${r(p2[0] - t2[0])} ${r(p2[1] - t2[1])} ` +
      `${r(p2[0])} ${r(p2[1])}`;
  }
  return `${d}Z`;
}
