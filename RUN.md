# WEDA Frontend Smoke Runbook

This workspace currently uses static frontend assets under `frontend/`.

## Prerequisites

- Node.js 18+
- npm 9+

## Install

```powershell
npm --prefix frontend install
```

## Start Local Dev Server

```powershell
npm --prefix frontend run dev
```

Default URL: `http://localhost:5173`

## QA Smoke Commands

Run accessibility lint:

```powershell
npm --prefix frontend run lint:a11y
```

Run perf smoke budget check:

```powershell
npm --prefix frontend run perf:smoke
```

Write perf report JSON:

```powershell
npm --prefix frontend run perf:report
```

Output file: `docs/qa/reports/WEDA-15/perf-smoke.json`

