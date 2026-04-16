# Testing Guide — Frontend MVP

This doc defines the minimum baseline for accessibility and performance checks referenced by WEDA-57.

## Accessibility (axe-core smoke)
- Install: `npm --prefix frontend i -D @axe-core/react @testing-library/react @testing-library/jest-dom`
- Add a sample test for a key route (e.g., Home) that mounts the component and runs axe with common rules enabled.
- Script: add `"test:a11y": "vitest run -t a11y"` or similar based on your test file naming.
- Output: include violations in console; attach the first run output to WEDA-57.

## Performance (bundle budget + Lighthouse later)
- Set Vite `build.rollupOptions.output.manualChunks` if needed to keep initial route bundle under 200KB gzip.
- Track bundle size on build; fail builds when thresholds are exceeded (use `rollup-plugin-filesize` or custom check).
- Script: `"test:perf": "node scripts/check-bundle-budgets.js"` (placeholder acceptable in Sprint 1; create script when budgets are known).

## Local Run
- Build: `npm --prefix frontend run build`
- Lint: `npm --prefix frontend run lint`
- A11y smoke: `npm --prefix frontend run test:a11y`
- Perf budget check: `npm --prefix frontend run test:perf`

## PR Expectations
- Check the PR template boxes for a11y/perf.
- Attach screenshots for UI changes and paste the a11y smoke summary when adding new flows.

## Notes
- For complex pages, rely on semantic HTML, visible focus states, and skip links where needed.
- File bugs or follow-ups as WEDA issues if violations are acceptable temporarily.
