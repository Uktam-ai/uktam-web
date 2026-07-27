export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=ai.uktam";
export const GITHUB_URL = "https://github.com/ashb155/uktam";

export const PILLARS = [
  {
    label: "Privacy",
    title: "100% offline & private",
    body: "No audio and no transcript ever leaves your device. Speech recognition, translation and speech synthesis all run locally on your phone's silicon.",
    emerald: true,
  },
  {
    label: "Indic-first",
    title: "Made for India, by Indian AI",
    body: "Built strictly on models researched and trained for Indian languages — AI4Bharat and Sarvam AI — so dialects, nuance and grammar land properly.",
  },
  {
    label: "Optimized",
    title: "Custom quantized for mobile",
    body: "Multi-billion parameter models custom-quantized to GGUF and ONNX for this project, cutting memory and battery cost while holding near-parity accuracy.",
  },
  {
    label: "Independence",
    title: "No round trip, ever",
    body: "Speech lands as text in about 200 ms on device. Nothing queues behind an API and nothing degrades when the signal does — dead zones, remote areas and aeroplanes all behave identically.",
  },
];

/**
 * Language pairs the hero headline cycles through. Each is a direction the app
 * actually supports, and the two sides are always different languages.
 */
export const HEADLINE_PAIRS = [
  { from: "hi", to: "ta" },
  { from: "kn", to: "hi" },
  { from: "ta", to: "te" },
  { from: "te", to: "kn" },
] as const;

/** Headline figures under the hero. Every one is measured, not aspirational. */
export const HERO_STATS = [
  { value: "~200 ms", label: "On-device ASR" },
  { value: "0", label: "Network calls" },
  { value: "GPL-3.0", label: "Open source" },
];

export const PIPELINE = [
  {
    step: "01",
    title: "Speak",
    engine: "Microphone",
    timing: "live",
    body: "Talk naturally in Hindi, Kannada, Tamil or Telugu. Audio is captured and streamed straight into the on-device pipeline.",
  },
  {
    step: "02",
    title: "Recognize",
    engine: "Sherpa-ONNX · IndicConformer",
    timing: "~200 ms",
    body: "AI4Bharat's IndicConformer transcribes speech in about 200 ms, entirely locally, with no cloud ASR endpoint involved.",
  },
  {
    step: "03",
    title: "Translate",
    engine: "llama.cpp · Sarvam Translate",
    timing: "7–11 s",
    body: "Sarvam Translate runs through custom JNI bindings over llama.cpp. A multi-billion parameter model on phone silicon takes a few seconds — and it takes them whether or not you have signal.",
  },
  {
    step: "04",
    title: "Speak back",
    engine: "Android native TTS",
    timing: "instant",
    body: "The translated text is spoken aloud through Android's offline text-to-speech engine — a full speech-to-speech loop.",
  },
];

export const LANGUAGES = [
  { script: "हिन्दी", name: "Hindi", code: "hi", font: "devanagari" },
  { script: "ಕನ್ನಡ", name: "Kannada", code: "kn", font: "kannada" },
  { script: "தமிழ்", name: "Tamil", code: "ta", font: "tamil" },
  { script: "తెలుగు", name: "Telugu", code: "te", font: "telugu" },
];

/**
 * A real exchange captured from the Android app, timings included. `direction`
 * mirrors the app's own colour semantics: outbound turns are blue, the reply
 * is green.
 */
export const CONVERSATION = [
  {
    direction: "out",
    from: "hi",
    to: "kn",
    source: "मैं अभी बाहर जा रहा हूं",
    target: "ನಾನು ಈಗಲೇ ಹೊರಡುತ್ತಿದ್ದೇನೆ.",
    asrMs: 198,
    translateS: 7.58,
  },
  {
    direction: "in",
    from: "kn",
    to: "hi",
    source: "ನೀನು ಎಲ್ಲಿ ಹೋಗ್ತಾ ಇದ್ದೀರಾ",
    target: "तुम कहाँ जा रहे हो?",
    asrMs: 203,
    translateS: 7.656,
  },
  {
    direction: "out",
    from: "hi",
    to: "kn",
    source: "मैं अभी कॉलेज को जाके वापस शाम पांच बजे को आऊंगा",
    target: "ನಾನು ಕಾಲೇಜಿಗೆ ಹೋಗಿ ಸಂಜೆ ೫ ಗಂಟೆಗೆ ಹಿಂತಿರುಗುತ್ತೇನೆ.",
    asrMs: 314,
    translateS: 11.024,
  },
];

export const STATS = [
  { value: 4, suffix: "", label: "Indic languages" },
  { value: 0, suffix: "", label: "API calls made" },
  { value: 100, suffix: "%", label: "On-device compute" },
];

export const STACK = [
  { k: "Language", v: "Kotlin" },
  { k: "UI", v: "Jetpack Compose · Material 3" },
  { k: "Architecture", v: "MVVM · StateFlow · Coroutines" },
  { k: "ASR", v: "Sherpa-ONNX · AI4Bharat IndicConformer" },
  { k: "Translation", v: "llama.cpp (JNI) · Sarvam Translate" },
  { k: "Build", v: "Gradle KTS · CMake · Android NDK" },
  { k: "Delivery", v: "Play Asset Delivery" },
  { k: "Licence", v: "GPL-3.0" },
];

/**
 * The questions someone actually asks before installing this, and the ones an
 * answer engine needs a source for.
 *
 * Two rules here, both load-bearing:
 *
 * Every answer is self-contained. "Yes, after the first run" is useless as a
 * citation — anything quoting it has to carry the subject with it, so each
 * answer restates what it is answering about. That is also what makes them read
 * properly when a screen reader jumps straight to one.
 *
 * Every claim is already made somewhere else on this page or in the repo:
 * REQUIREMENTS for the hardware and download figures, PIPELINE for the
 * timings, STACK for the licence, LANGUAGES for the pairs. Nothing is invented
 * here, because this array is also the source for the FAQPage structured data
 * and inventing a number would be inventing it in the thing Google reads.
 */
export const FAQ = [
  {
    q: "Does Uktam.ai work without an internet connection?",
    a: "Yes. After the one-time model download on first launch, Uktam.ai never needs a network again. Speech recognition, translation and speech synthesis all run on the phone, so the app behaves identically in a dead zone, on a flight or in a remote area as it does on wifi.",
  },
  {
    q: "Which languages does Uktam.ai translate between?",
    a: "Hindi, Kannada, Tamil and Telugu, in every direction between them — twelve language pairs. More Indic languages are planned.",
  },
  {
    q: "Is my voice or transcript ever uploaded?",
    a: "No. No audio and no transcript leaves the device. The app makes zero network calls while translating, because every model it uses is running locally on the phone's own silicon.",
  },
  {
    q: "How much storage does Uktam.ai need?",
    a: "Roughly 1 to 2.5 GB, downloaded once on first run depending on which model your hardware gets. After that the app is permanently offline and downloads nothing further.",
  },
  {
    q: "What Android version and hardware does it need?",
    a: "Android 14 or newer (API level 34), with 6 GB of RAM recommended. The app sizes its translation model to the device: over 6 GB it loads a higher-accuracy build, at or below 6 GB it loads a lighter one so it does not run out of memory.",
  },
  {
    q: "How fast is an offline translation?",
    a: "Speech becomes text in about 200 milliseconds. The translation itself takes roughly 7 to 11 seconds, because a multi-billion parameter model is running on phone hardware rather than in a data centre. Speaking the result back is instant.",
  },
  {
    q: "Is Uktam.ai free, and is the source available?",
    a: "Yes to both. Uktam.ai is free on Google Play and the source is published under the GPL-3.0 licence.",
  },
  {
    q: "Is there an iPhone version?",
    a: "Not yet. Uktam.ai is Android-only today; an iOS version is planned but not released.",
  },
] as const;

/**
 * The three models, in pipeline order, each behind a disclosure.
 *
 * This replaced a standalone "dynamic model selection" panel that showed two
 * rows of quantization thresholds and nothing else. The thresholds were the
 * most interesting thing on that card and the least explained — they now sit
 * inside the model they actually describe, next to why that model needs them.
 *
 * `meta` is what the closed row has to earn its place with: a summary that says
 * only "Translation" gives a reader no reason to open it, so each one carries
 * the figure or the runtime that makes it worth a click.
 */
export const MODELS = [
  {
    name: "IndicConformer",
    role: "Speech recognition",
    meta: "AI4Bharat · ~200 ms",
    body: "AI4Bharat's Conformer acoustic model, trained on Indian languages rather than adapted to them, which is what keeps recognition honest across accents and code-mixing. It runs through Sherpa-ONNX on the phone's own compute and returns text in roughly 200 milliseconds — fast enough that the transcript appears while you are still talking.",
  },
  {
    name: "Sarvam Translate",
    role: "Translation",
    meta: "llama.cpp · 7–11 s",
    body: "A multi-billion parameter translation model reached through custom JNI bindings over llama.cpp, quantized to GGUF specifically for this project. The app picks the build your hardware can hold: above 6 GB of RAM it loads Q4_K_S for higher accuracy, at or below 6 GB it loads Q2_K for a lighter memory footprint. Either way it takes 7 to 11 seconds, because this is a language model running on a phone rather than in a data centre — and it takes them whether or not you have signal.",
  },
  {
    name: "Android text-to-speech",
    role: "Speech synthesis",
    meta: "Platform native · instant",
    body: "The final step uses the offline voices Android already ships, so there is no fourth model to download and nothing to warm up. It speaks the translation as soon as the text exists, which closes the loop: voice in, voice out, no network touched at any point.",
  },
] as const;

export const REQUIREMENTS = [
  { k: "Android", v: "14+ (API level 34)" },
  { k: "Memory", v: "6 GB RAM recommended" },
  { k: "First run", v: "~1–2.5 GB model download" },
  { k: "After setup", v: "Permanently offline" },
];
