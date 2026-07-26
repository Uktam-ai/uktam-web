# Uktam.ai — Product Context

## Register

**Brand.** A single-page marketing site. The design *is* the product here — the
page's job is to make an unbelievable-sounding claim believable.

## What it is

An Android app that translates speech to speech between Hindi, Kannada, Tamil
and Telugu with every model running on the device. No network, ever. Built on
AI4Bharat and Sarvam AI research, quantized to run on ordinary phone hardware.
GPL-3.0. App source: github.com/ashb155/uktam

## Users

Two audiences reading the same page for different reasons:

- **Indian Android users** who move between languages daily and are often in
  places with no usable signal — trains, villages, basements, flights. They want
  to know it works offline, in their language, for free.
- **Developers and ML people** who will not believe "fully on-device" until they
  see the stack. They want model names, quantization formats, and real latency.

The page has to satisfy the sceptic without losing the first group.

## The job

Get an install. Everything else serves that.

## Voice

Three words: **plain, precise, unhurried.**

The product's whole argument is that nothing is being hidden from you, so the
page cannot oversell. It states measured numbers, names its dependencies, and
admits what is slow. Trust is the conversion mechanism.

This is why the latency copy matters: the app reports 7–11s translation, so the
page says 7–11s. An earlier draft claimed "zero latency" and the product's own
screenshot contradicted it.

## Anti-references

- **The AI-startup landing page.** Gradient mesh hero, three identical feature
  cards, an uppercase eyebrow over every section, a big number with a small
  label. If it could be any AI product, it has failed.
- **Cloud-translator marketing.** The category sells convenience. This product
  sells the opposite of a round trip.
- **Editorial-typographic.** Display serif, italic pull quotes, rule-separated
  columns. Wrong register — this is software, not a magazine.

## Benchmark

incredibles.dev, for **motion grammar only**, not looks. What was taken:
clip-path wipes as the primary reveal, a hard two-speed rule (entrances slow,
feedback under 220ms), and display type set tight.

## Accessibility

- WCAG AA: body ≥4.5:1, large text ≥3:1. Verified, currently 5.8–19.2:1.
- `prefers-reduced-motion` honoured by every animation, with explicit resting
  states rather than a blanket duration override.
- The page must be readable with JavaScript disabled.
- Every Indic string carries a `lang` attribute so the right font and the right
  screen-reader voice apply.

## Strategic principles

1. **Show the product, don't describe it.** The hero headline performs a
   translation; the phone shows a real transcript with real timings.
2. **Colour means language.** Cyan is the source, green is the target — the
   same semantic the Android app uses. Colour is never decoration here.
3. **Never claim what the screenshot contradicts.**
4. **The Indic scripts are the most distinctive asset on the page.** They are
   set as typography, not decoration.
