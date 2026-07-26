/**
 * Downloads every webfont the site uses into `public/fonts/` and writes the
 * matching `@font-face` rules to `src/styles/fonts.css`.
 *
 *   bun run fonts
 *
 * Fonts are self-hosted so the page makes no third-party requests on load.
 * The Indic faces are glyph-subset to exactly the characters the site renders —
 * if you change any Devanagari, Kannada, Tamil or Telugu copy, add it to
 * INDIC_SOURCE_TEXT below and re-run this script, or those glyphs will render
 * as tofu.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const FONT_DIR = path.join(ROOT, "public", "fonts");
const CSS_OUT = path.join(ROOT, "src", "styles", "fonts.css");

// Google only serves woff2 to browsers that advertise support for it.
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Every Indic string the site renders, keyed by script. Entries marked
 * "headroom" are not rendered anywhere — they only widen the glyph subset so
 * small copy edits don't immediately produce tofu.
 */
const INDIC_SOURCE_TEXT = {
  devanagari: [
    "हिन्दी",
    "मैं अभी बाहर जा रहा हूं",
    "तुम कहाँ जा रहे हो?",
    "मैं अभी कॉलेज को जाके वापस शाम पांच बजे को आऊंगा",
    "मुझे स्टेशन का रास्ता बताइए",
    "यह ऐप इंटरनेट के बिना काम करता है",
  ],
  kannada: [
    "ಕನ್ನಡ",
    "ನಾನು ಈಗಲೇ ಹೊರಡುತ್ತಿದ್ದೇನೆ.",
    "ನೀನು ಎಲ್ಲಿ ಹೋಗ್ತಾ ಇದ್ದೀರಾ",
    "ನಾನು ಕಾಲೇಜಿಗೆ ಹೋಗಿ ಸಂಜೆ ೫ ಗಂಟೆಗೆ ಹಿಂತಿರುಗುತ್ತೇನೆ.",
  ],
  tamil: ["தமிழ்", "ரயில் நிலையத்திற்கு வழி சொல்லுங்கள்", "இந்த ஆப் இணையம் இல்லாமல் வேலை செய்யும்"],
  // Telugu appears only as the language name today; the second string is headroom.
  telugu: ["తెలుగు", "మీరు ఎక్కడికి వెళ్తున్నారు"],
};

const INDIC_FAMILIES = {
  devanagari: "Noto Sans Devanagari",
  kannada: "Noto Sans Kannada",
  tamil: "Noto Sans Tamil",
  telugu: "Noto Sans Telugu",
};

async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.text();
}

async function download(url, filename) {
  const res = await fetch(url, { headers: { "User-Agent": CHROME_UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  await writeFile(path.join(FONT_DIR, filename), bytes);
  console.log(`  ${filename.padEnd(34)} ${(bytes.length / 1024).toFixed(1).padStart(7)} kB`);
  return bytes.length;
}

/** Splits a Google/Fontshare stylesheet into individual @font-face blocks. */
function parseFaces(css) {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
    weight: body.match(/font-weight:\s*([^;]+);/)?.[1].trim() ?? "400",
    style: body.match(/font-style:\s*([^;]+);/)?.[1].trim() ?? "normal",
    unicodeRange: body.match(/unicode-range:\s*([^;]+);/)?.[1].trim(),
    // Match on the format() declaration rather than a .woff2 extension —
    // Google's subset endpoint serves from `/l/font?kit=...` with no extension.
    // Fontshare emits protocol-relative URLs.
    url: body.match(/url\((['"]?)((?:\/\/|https:\/\/)[^'")]+)\1\)\s*format\(['"]woff2['"]\)/)?.[2],
  }));
}

const withScheme = (url) => (url.startsWith("//") ? `https:${url}` : url);

const rule = ({ family, weight, file, unicodeRange, display = "swap" }) =>
  [
    "@font-face {",
    `  font-family: "${family}";`,
    `  src: url("/fonts/${file}") format("woff2");`,
    `  font-weight: ${weight};`,
    "  font-style: normal;",
    `  font-display: ${display};`,
    unicodeRange ? `  unicode-range: ${unicodeRange};` : null,
    "}",
  ]
    .filter(Boolean)
    .join("\n");

async function satoshi() {
  console.log("\nSatoshi (Fontshare)");
  const css = await fetchText(
    "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap",
    { "User-Agent": CHROME_UA },
  );
  const rules = [];
  let bytes = 0;
  for (const face of parseFaces(css)) {
    if (!face.url || face.style !== "normal") continue;
    const file = `satoshi-${face.weight}.woff2`;
    bytes += await download(withScheme(face.url), file);
    rules.push(rule({ family: "Satoshi", weight: face.weight, file }));
  }
  return { rules, bytes };
}

async function plexMono() {
  console.log("\nIBM Plex Mono (Google)");
  const css = await fetchText(
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap",
    { "User-Agent": CHROME_UA },
  );
  // Google emits one face per unicode subset. We only need Latin.
  const faces = parseFaces(css).filter(
    (f) => f.url && f.unicodeRange?.includes("U+0000") && f.style === "normal",
  );
  const rules = [];
  let bytes = 0;
  for (const face of faces) {
    const file = `plex-mono-${face.weight}.woff2`;
    bytes += await download(face.url, file);
    rules.push(
      rule({
        family: "IBM Plex Mono",
        weight: face.weight,
        file,
        unicodeRange: face.unicodeRange,
      }),
    );
  }
  return { rules, bytes };
}

async function indic() {
  console.log("\nIndic (Google, glyph-subset)");
  const rules = [];
  let bytes = 0;
  for (const [script, family] of Object.entries(INDIC_FAMILIES)) {
    // Deduplicate to keep the request URL short, and always include digits and
    // the punctuation the transcript lines use.
    const chars = [...new Set([...INDIC_SOURCE_TEXT[script].join(""), ..."0123456789.,?!— "])].join(
      "",
    );
    // Deliberately the v1 API, not css2. The Noto Indic families are variable
    // fonts, and css2 serves the variable file even for a single weight — the
    // variation tables dwarf the handful of glyphs we asked for (54 kB vs
    // 7 kB for Devanagari). v1 serves static instances, but only when asked
    // for exactly one weight; a comma-separated list redirects back to css2.
    for (const weight of [400, 600]) {
      const url =
        `https://fonts.googleapis.com/css?family=${family.replace(/ /g, "+")}:${weight}` +
        `&text=${encodeURIComponent(chars)}&display=swap`;
      const css = await fetchText(url, { "User-Agent": CHROME_UA });

      const face = parseFaces(css).find((f) => f.url);
      if (!face) throw new Error(`no woff2 face returned for ${family} ${weight}`);

      const file = `noto-${script}-${weight}.woff2`;
      bytes += await download(face.url, file);
      rules.push({ family, weight, file, unicodeRange: face.unicodeRange });
    }
  }
  return { rules: rules.map(rule), bytes };
}

await mkdir(FONT_DIR, { recursive: true });
await mkdir(path.dirname(CSS_OUT), { recursive: true });

const results = [await satoshi(), await plexMono(), await indic()];
const total = results.reduce((sum, r) => sum + r.bytes, 0);

await writeFile(
  CSS_OUT,
  [
    "/*",
    " * Generated by scripts/fetch-fonts.mjs — do not edit by hand.",
    " * Run `bun run fonts` to regenerate after changing the font list or any",
    " * Indic copy (the Indic faces are subset to the exact glyphs we render).",
    " */",
    "",
    ...results.flatMap((r) => r.rules),
    "",
  ].join("\n"),
);

console.log(
  `\ntotal ${(total / 1024).toFixed(1)} kB across ${results.reduce(
    (n, r) => n + r.rules.length,
    0,
  )} faces`,
);
console.log(`wrote ${path.relative(ROOT, CSS_OUT)}`);
