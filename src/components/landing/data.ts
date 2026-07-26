export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.uktam.ai";
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
    label: "Optimised",
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
    title: "Recognise",
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

export const REQUIREMENTS = [
  { k: "Android", v: "14+ (API level 34)" },
  { k: "Memory", v: "6 GB RAM recommended" },
  { k: "First run", v: "~1–2.5 GB model download" },
  { k: "After setup", v: "Permanently offline" },
];
