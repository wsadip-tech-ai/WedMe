# WEDA-15 — QA Validation Plan (CTO Handoff)

Entry criteria
- CTO decision posted on WEDA-15 with either `accept` or `accept-with-conditions` and a commit/branch ref

Test areas
- Functional regression vs WEDA-6 acceptance criteria
- A11y validation (WCAG 2.2 AA basics) across key screens
- Performance sanity: initial load & route change targets

Checklist
- [ ] Smoke test primary flows (WEDA-4)
- [ ] Axe scan: no criticals; minors logged
- [ ] Lighthouse run: attach JSON; note deltas vs budget
- [ ] Error/empty/loading states verified
- [ ] Cross-browser: Chrome/Edge + one Safari check if possible

Outputs
- Comment on WEDA-6/WEDA-2 summarizing pass/fail + issues
- Attach reports under `docs/qa/reports/WEDA-15/`