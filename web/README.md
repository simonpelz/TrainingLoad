# Training Load — web app

Private, browser-only Fitness / Fatigue / Form tracker (CTL / ATL / TSB).
Vite + React + TypeScript + Tailwind + ECharts. All computation runs
client-side; training data never leaves the browser.

## Develop

```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

## Build & preview

```bash
npm run build      # type-checks, then builds to web/dist
npm run preview
```

For a GitHub Pages build (asset paths under /TrainingLoad/):

```bash
GITHUB_PAGES=1 npm run build
```

## Other scripts

```bash
npm run lint       # eslint
npm run format     # prettier --write
npm test           # vitest (core engine parity tests, added in WP1)
```

## UI components

Set up for [shadcn/ui](https://ui.shadcn.com) (`components.json`). Add
components with, e.g.:

```bash
npx shadcn@latest add button card
```

## Status

WP0 (scaffold) done. Next: WP1 — port the CTL/ATL/TSB engine to TypeScript
with parity tests against the Python implementation in `../desktop`.
See [`../docs/ROADMAP.md`](../docs/ROADMAP.md).
