/**
 * Builds the share card: `public/brand/og.gif`, plus the still
 * `public/brand/og.png` that non-animating crawlers fall back to.
 *
 * The card is `scripts/og-card.html`, screenshotted once per distinct frame by
 * headless Chrome and encoded by ffmpeg. Neither is a dependency of the site —
 * this runs by hand after the hero copy, the language list or the brand mark
 * changes, and its output is committed. Adding a browser and an encoder to
 * `package.json` to regenerate a file that changes twice a year is a poor
 * trade, so the script finds what is already installed and says plainly what is
 * missing when it is not.
 *
 *   bun run og
 *
 * Why a GIF at all: og:image is the only animated surface a link unfurl has,
 * and the languages cycling is the one thing about this product that a still
 * frame cannot show. Support is genuinely partial — Slack, Discord, Telegram
 * and iMessage animate it; Facebook, LinkedIn and X show the first frame and
 * nothing else. That asymmetry is designed around rather than hoped past: the
 * first frame is a settled, complete card, and twitter:image points at the PNG
 * instead, because X's card renderer has historically been the one most willing
 * to reject a GIF outright rather than flatten it.
 */

import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cardHtml = join(root, "scripts", "og-card.html");
const outDir = join(root, "public", "brand");

/** 1200×630 is the size every crawler documents, and the only one X accepts. */
const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Rendered at 2× and downsampled with lanczos. Chrome's 1× text rasterization
 * is fine on screen and visibly soft once a GIF palette has been quantized over
 * it; supersampling costs four screenshots' worth of pixels and buys back the
 * edge definition on the display weight, which is where it shows.
 */
const SCALE = 2;

/** 12.5fps — 80ms per frame, the coarsest step a GIF delay can hold exactly. */
const FPS = 12.5;
const HOLD_FRAMES = 17; // 1.36s settled on each pair
const SWAP_FRAMES = 5; // 400ms of slide, against the site's 420ms --duration-base

/**
 * Where along the slide to sample frame `f` of `SWAP_FRAMES`.
 *
 * Not the site's ease-out-quint. That curve is deliberately front-loaded —
 * cubic-bezier(0.23, 1, 0.32, 1) is about three quarters travelled 80ms in —
 * which is exactly right at 60fps and falls apart at 12.5, where the first
 * sampled frame would already be settled and the swap would read as a hard cut
 * with four dead frames after it. A gentle quadratic ease-out spreads the same
 * 400ms across five distinguishable positions, so the motion survives the frame
 * rate. Same gesture, sampled for the medium it is being encoded into.
 */
function easeOutQuad(u) {
  return 1 - (1 - u) ** 2;
}

/**
 * How far the mark turns over one loop — 45°, one petal.
 *
 * The site drifts its ambient mandala a full turn every 120s, and matching that
 * 3°/s is what this is trying to approximate. It cannot be matched exactly: a
 * GIF has to return to its first frame, so the rotation per loop has to be an
 * angle the rosette looks identical at, and at 3°/s the smallest such angle
 * would need a 15-second loop and roughly twice the bytes.
 *
 * 45° over 7s is 6.4°/s — the closest the loop length allows, and slow enough
 * to read as drift rather than as a spinning logo. The choices below it are not
 * free: 22.5° lands the petals between positions rather than on them, which is
 * a visibly different rosette at the seam rather than a nearly identical one.
 *
 * "Identical" is doing real work here. The rosette is a raster trace, so its
 * eight petals are not pixel-identical to each other and no rotation short of
 * 360° is exact. Measured against a 0° render, 45° differs only along thin
 * antialiased petal outlines — about twice the residue that 180° leaves, and
 * both are sub-pixel. One frame of that per loop is not visible; a half-petal
 * step would be.
 */
const LOOP_ROTATION = 45;

/** Palette headroom. 192 leaves the encoder room for the veil's gradient
 *  without spending the whole table on ramps nobody looks at. */
const MAX_COLORS = 192;

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

/**
 * execFileSync, but a failure prints what the tool actually said. Both ffmpeg
 * and Chrome report the useful part of a failure on stderr and nothing on the
 * exit code beyond "no", so swallowing it turns a missing font or a bad filter
 * into an unexplained non-zero exit.
 */
function run(command, args) {
  try {
    execFileSync(command, args, { stdio: ["ignore", "ignore", "pipe"] });
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    fail(`${command} failed.\n\n${stderr || error.message}`);
  }
}

/** Chrome, wherever this machine keeps it. */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA &&
      join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  const found = candidates.find((path) => existsSync(path));
  if (!found) {
    fail(
      "Could not find Chrome. Install it, or set CHROME_PATH to the binary.\n" +
        "  Any Chromium build works — it is only used to screenshot scripts/og-card.html.",
    );
  }
  return found;
}

function requireFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  } catch {
    fail("Could not run ffmpeg. Install it and put it on PATH — it encodes the GIF.");
  }
}

/**
 * The card carries its own copy of the language list, because it is opened over
 * file:// with no bundler to import through. That copy is allowed to exist and
 * is not allowed to drift, so it is checked against the real one here: adding a
 * language to data.ts should fail this build loudly, not ship a card that is
 * quietly one release out of date.
 */
function assertCardMatchesData() {
  const data = readFileSync(join(root, "src", "components", "landing", "data.ts"), "utf8");
  const card = readFileSync(cardHtml, "utf8");

  const pairsOf = (source, label) => {
    const block = source.match(/(?:HEADLINE_)?PAIRS\s*=\s*\[([\s\S]*?)\]/);
    if (!block) fail(`Could not read the language pairs out of ${label}.`);
    return [...block[1].matchAll(/from:\s*"(\w+)",\s*to:\s*"(\w+)"/g)]
      .map((m) => `${m[1]}>${m[2]}`)
      .join(",");
  };

  const scriptsOf = (source, label) => {
    const codes = [...source.matchAll(/code:\s*"(\w{2})"/g)].map((m) => m[1]);
    if (codes.length === 0) fail(`Could not read the language codes out of ${label}.`);
    return codes.join(",");
  };

  if (pairsOf(data, "data.ts") !== pairsOf(card, "og-card.html")) {
    fail("HEADLINE_PAIRS in data.ts and PAIRS in og-card.html disagree. Update the card.");
  }
  if (scriptsOf(data, "data.ts") !== scriptsOf(card, "og-card.html")) {
    fail("LANGUAGES in data.ts and og-card.html disagree. Update the card.");
  }

  return pairsOf(data, "data.ts").split(",").length;
}

async function shoot(chrome, url, out) {
  // Each frame gets its own profile directory. Chrome serializes launches that
  // share one, which would quietly undo the pool below and turn four workers
  // back into one.
  const profile = join(work, `profile-${Buffer.from(url).toString("base64url").slice(-24)}`);

  try {
    await execFileAsync(chrome, [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-sandbox",
      `--user-data-dir=${profile}`,
      // Fonts are local file reads, but they are still async, and --screenshot
      // does not wait on them. Virtual time does: Chrome runs the clock forward
      // until the page is quiet, then captures, so the capture cannot land on a
      // frame that is still in the fallback face.
      "--virtual-time-budget=4000",
      `--force-device-scale-factor=${SCALE}`,
      `--window-size=${WIDTH},${HEIGHT}`,
      `--screenshot=${out}`,
      url,
    ]);
  } catch (error) {
    fail(`Chrome failed on ${url}\n\n${error.stderr?.toString().trim() || error.message}`);
  }

  if (!existsSync(out)) fail(`Chrome produced no screenshot for ${url}`);
}

const chrome = findChrome();
requireFfmpeg();
const pairCount = assertCardMatchesData();

const work = mkdtempSync(join(tmpdir(), "uktam-og-"));

/**
 * The whole loop, one entry per frame.
 *
 * Ordered hold-then-swap, so frame one is a settled headline at zero rotation.
 * Every platform that refuses to animate shows exactly that frame, and a share
 * card frozen mid-slide — two half-faded words passing each other — would be
 * the card most people see.
 */
function plan() {
  const frames = [];

  for (let i = 0; i < pairCount; i++) {
    for (let h = 0; h < HOLD_FRAMES; h++) frames.push({ pair: i, e: 1 });

    // The swap leaving pair i is the swap arriving at pair i + 1, and the last
    // pair's closes the loop back to the first.
    const arriving = (i + 1) % pairCount;
    for (let f = 1; f <= SWAP_FRAMES; f++) {
      // Divided by SWAP_FRAMES + 1 so no swap frame lands on e=1: that position
      // is the settled card, which the hold immediately after already holds.
      frames.push({ pair: arriving, e: easeOutQuad(f / (SWAP_FRAMES + 1)) });
    }
  }

  return frames.map((frame, index) => ({
    ...frame,
    rotation: (LOOP_ROTATION * index) / frames.length,
  }));
}

/**
 * Renders every frame, four browsers at a time.
 *
 * Sequential was fine while the mark stood still and only twenty-four frames
 * differed; a rotating mark makes every frame distinct, and eighty-eight cold
 * Chrome starts back to back is several minutes of nothing happening. The pool
 * is small on purpose — these are whole browsers, and past about four the disk
 * becomes the limit rather than the CPU.
 */
async function render(frames) {
  const paths = frames.map((_, index) => join(work, `frame-${String(index).padStart(3, "0")}.png`));
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (next < frames.length) {
      const index = next++;
      const { pair, e, rotation } = frames[index];
      await shoot(
        chrome,
        `${pathToFileURL(cardHtml).href}?i=${pair}&e=${e}&r=${rotation}`,
        paths[index],
      );
      done++;
      process.stdout.write(`\r  rendered ${done}/${frames.length} frames`);
    }
  };

  await Promise.all(Array.from({ length: 4 }, worker));
  process.stdout.write("\n");
  return paths;
}

try {
  mkdirSync(outDir, { recursive: true });

  const frames = plan();
  const paths = await render(frames);

  const gif = join(outDir, "og.gif");
  run("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    join(work, "frame-%03d.png"),
    "-filter_complex",
    // stats_mode=full, not diff. diff weights the palette toward whatever moves
    // between frames, which was right when the only moving thing was two words
    // and is wrong now: the mark turns on every frame, so diff hands most of the
    // table to the rosette and leaves the veil's gradient to band. diff_mode
    // still limits each written frame to the rectangle that changed.
    `scale=${WIDTH}:${HEIGHT}:flags=lanczos,split[a][b];` +
      `[a]palettegen=max_colors=${MAX_COLORS}:stats_mode=full[p];` +
      `[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
    "-loop",
    "0",
    gif,
  ]);

  // The still is the first frame, downsampled the same way, so the fallback and
  // the animation are the same card rather than two things that resemble each
  // other.
  const png = join(outDir, "og.png");
  run("ffmpeg", [
    "-y",
    "-i",
    paths[0],
    "-vf",
    `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
    "-frames:v",
    "1",
    png,
  ]);

  const kb = (path) => `${Math.round(readFileSync(path).byteLength / 1024)} kB`;
  console.log(
    `\n  og.gif  ${kb(gif)}  ${frames.length} frames · ${(frames.length / FPS).toFixed(2)}s loop` +
      `\n  og.png  ${kb(png)}  first frame\n`,
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
