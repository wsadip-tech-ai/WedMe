# QA Smoke Runbook

Commands (from repo root):
- A11y smoke: `npm --prefix frontend run lint:a11y`
- Perf smoke: `npm --prefix frontend run perf:smoke`
- Build: `npm --prefix frontend run build`

Artifacts
- Store perf reports under `docs/qa/reports/<WEDA-ID>/perf-smoke.json`

Notes
- Ensure `.env.example` covers any required keys; do not commit secrets
- Include screenshots for any UI changes in PRs