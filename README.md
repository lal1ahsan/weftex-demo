# GH Weaving — Weaving Factory Management System (Demo)

An interactive, frontend-only product demo of a weaving factory management system for the Pakistan market. It's built to show to weaving factory owners and managers.

> **Demo mode:** there is no backend, database, real authentication or API. All data is realistic mock data for an 80-loom factory in Faisalabad. Records you add (production, downtime, expenses) last for the browser session and reset on reload.

**Demo login:** `demo@ghweaving.com` / `demo123` (any valid email and password works)

## Tech stack

- React 18 + TypeScript + Vite 6
- Tailwind CSS v4
- React Router 6
- Recharts
- Lucide icons

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

## Production build

```bash
npm run build      # type-checks, then builds to dist/
npm run preview    # serve the production build locally
```

## Deploy to Vercel

The project is ready for Vercel and needs no environment variables.

**Option A: Dashboard**
1. Push this folder to a GitHub / GitLab / Bitbucket repository.
2. In Vercel, click **Add New → Project** and import the repository.
3. Vercel detects **Vite**. Keep the defaults: build command `npm run build`, output directory `dist`.
4. Click **Deploy**.

**Option B: CLI**
```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

`vercel.json` rewrites every path to `index.html`, so deep links like `/looms/L-12` work on refresh.

## Suggested demo flow

Login → Dashboard → Loom Dashboard → **L-12** (stopped) → Production → **Add Production** → Downtime → view a breakdown → Yarn Inventory → Fabric Inventory → Costing → Electricity / Solar → Reports

Global search works with `Ctrl/⌘ K` or `/`. Try `L-12`, `YRN-001`, `Roll R-10251`, `Ahmed Textile` or `SO-1024`.

## Project structure

```
src/
├── components/
│   ├── ui/          # Button, Card, KpiCard, DataTable, Modal, Toast, Form, Tabs, Badge…
│   ├── charts/      # Chart kit (tooltip, legend, palette) and shared charts
│   ├── forms/       # Production / downtime forms, breakdown modal, config-driven QuickFormModal
│   ├── common/      # Import / Export / Print actions
│   └── brand/       # Logo
├── context/         # AppState: demo auth, session records, loom status, notifications
├── data/            # Seeded mock data (looms, production, yarn, fabric, sales, energy) + metrics
├── hooks/
├── layouts/         # App shell: sidebar, top bar, global search
├── pages/           # One folder per module
├── routes/          # Route table and navigation config
├── types/
└── utils/           # Formatting (PKR, meters, dates)
```

### Changing the demo numbers

- Headline production figures (245,500 m, 94.4%, 5h 42m downtime, 2.3% wastage) live in `CALIBRATION` in `src/data/production.ts`. Loom, shift and record data are scaled to match them.
- Stock values (yarn PKR 25.4M, fabric PKR 31.2M) and receivables (PKR 18.5M) are calibrated in `src/data/inventory.ts` and `src/data/commercial.ts`.
- The cost-per-meter model is in `src/data/costing.ts`. The calculator's default scenario is `EXAMPLE_BATCH`.
- The demo date is fixed to 29 September 2026 (`DEMO_TODAY` in `src/data/seed.ts`), so the story is the same every time.
