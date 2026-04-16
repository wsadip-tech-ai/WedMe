# WEDA-34 — API wiring & error handling (notes)

Plan
1) Introduce a `fetchVendors(params)` in `frontend/app.js`
2) Set `data-state` on root panel: `loading | empty | error | ready`
3) Render loading spinner/text while fetching
4) On error, render retry CTA and log to a placeholder `reportError()`
5) Validate inputs (e.g., budget min/max) before calling API

Example (app.js)
```js
async function fetchVendors(params) {
  const url = new URL('/api/vendors', location.origin);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

States
- loading: disable form submit, show spinner
- empty: show "No vendors match filters"
- error: show message + retry
- ready: render list

Follow-ups
- Hook basic error reporting (Sentry or console placeholder)
- Add contract doc with request/response JSON
