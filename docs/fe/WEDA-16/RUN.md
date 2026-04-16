# RUN.md — Frontend Continuity Baseline

Prereqs
- Node.js 18+

Quick start (local checks)
1. From repo root: `cd frontend`
2. A11y quick check: `npm run lint:a11y`
3. Perf smoke: `npm run perf:smoke`

Manual preview (optional)
- Option A: Use the perf smoke server (serves index/styles/app): `node ./scripts/perf-smoke.mjs`
- Option B: Any static server (e.g., `npx http-server .` or VS Code Live Server)

What to attach (for CTO/QA)
- Lighthouse JSON for homepage and discovery filtered state
- axe JSON for key screens
- Notes on any known issues and follow-ups

Dev server (with mock API)
- From repo root: 
pm --prefix frontend run dev then open http://127.0.0.1:5173
- Supports GET /api/vendors with ?category=&tier=&city= per docs/api/vendors-contract.md