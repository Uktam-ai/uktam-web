export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.uktam.ai";
export const GITHUB_URL = "https://github.com/ashb155/uktam";

export const PILLARS = [
  {
    label: "01 / Privacy",
    title: "100% offline & private",
    body: "No audio and no transcript ever leaves your device. Speech recognition, translation and speech synthesis all run locally on your phone's silicon.",
    emerald: true,
  },
  {
    label: "02 / Indic-first",
    title: "Made for India, by Indian AI",
    body: "Built strictly on models researched and trained for Indian languages — AI4Bharat and Sarvam AI — so dialects, nuance and grammar land properly.",
  },
  {
    label: "03 / Optimised",
    title: "Custom quantized for mobile",
    body: "Multi-billion parameter models custom-quantized to GGUF and ONNX for this project, cutting memory and battery cost while holding near-parity accuracy.",
  },
  {
    label: "04 / Speed",
    title: "Zero latency, no internet",
    body: "No round trip, no API queue. Once the models are on device you translate in remote areas, dead zones and aeroplanes without a single byte of data.",
  },
];

export const PIPELINE = [
  {
    step: "01",
    title: "Speak",
    engine: "Microphone",
    body: "Talk naturally in Hindi, Kannada, Tamil or Telugu. Audio is captured and streamed straight into the on-device pipeline.",
  },
  {
    step: "02",
    title: "Recognise",
    engine: "Sherpa-ONNX · IndicConformer",
    body: "AI4Bharat's IndicConformer transcribes speech in real time, entirely locally, with no cloud ASR endpoint involved.",
  },
  {
    step: "03",
    title: "Translate",
    engine: "llama.cpp · Sarvam Translate",
    body: "The Sarvam Translate model runs through custom JNI bindings over llama.cpp for accurate offline machine translation.",
  },
  {
    step: "04",
    title: "Speak back",
    engine: "Android native TTS",
    body: "The translated text is spoken aloud through Android's offline text-to-speech engine — a full speech-to-speech loop.",
  },
];

export const LANGUAGES = [
  { script: "हिन्दी", name: "Hindi", code: "hi" },
  { script: "ಕನ್ನಡ", name: "Kannada", code: "kn" },
  { script: "தமிழ்", name: "Tamil", code: "ta" },
  { script: "తెలుగు", name: "Telugu", code: "te" },
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
