# Uktam.ai

Marketing site for **Uktam.ai** — real-time, fully offline speech-to-speech
translation between Hindi, Kannada, Tamil and Telugu. Every model runs on the
Android device; nothing leaves the phone.

App source: <https://github.com/ashb155/uktam>

## Development

Requires [bun](https://bun.sh).

```sh
bun install
bun run dev
```

The dev server listens on <http://localhost:8080>.

| Script            | Does                       |
| ----------------- | -------------------------- |
| `bun run dev`     | Start the dev server       |
| `bun run build`   | Production build           |
| `bun run preview` | Serve the production build |
| `bun run lint`    | ESLint                     |
| `bun run format`  | Prettier                   |

## Built with

- [TanStack Start](https://tanstack.com/start) — SSR and file-based routing
- React 19 + TypeScript
- Tailwind CSS v4
- [anime.js](https://animejs.com) v4 — animation and scroll observers
- [Lenis](https://lenis.darkroom.engineering) — inertia scrolling

## Licence

The Uktam.ai Android app is GPL-3.0. Speech and translation models are by
[AI4Bharat](https://ai4bharat.iitm.ac.in) and [Sarvam AI](https://www.sarvam.ai).
