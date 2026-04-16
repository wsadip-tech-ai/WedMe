# CONTRIBUTING

## Escalation: Claude Code (Senior All-Rounder)

The board has a senior engineer available via the Claude Code CLI who can:

- Build complete React pages and components (frontend-design skill)
- Write Supabase schema migrations, RLS policies, Edge Functions
- Implement auth flows, API integrations, file upload logic
- Review and fix PRs blocked on technical complexity
- Unblock any sprint ticket agents cannot complete independently

**How to escalate:**
1. Set issue status to `blocked`
2. Post a comment with prefix `ESCALATE:CLAUDE-CODE`
3. Describe what you tried, what failed, and what output is needed
4. The board will relay to Claude Code who will implement and update the workspace

Never stay silent if stuck. One clear escalation beats a stalled sprint.

---

## Key Docs

| Document | Path |
|---|---|
| Platform v2 design spec | `docs/superpowers/specs/2026-03-29-weda-platform-v2-design.md` |
| Vendor API contract | `docs/api/vendors-contract.md` |

## Sprint Sequence (Platform v2)

Work in order — each sprint depends on the previous:

```
WEDA-43 → WEDA-38 → WEDA-39 → WEDA-40 → WEDA-41 → WEDA-42
```

Do not start WEDA-38 until WEDA-43 (CTO spec review) is closed.

---

## Tech Stack (Platform v2)

- **Framework:** React 18 + Vite (`frontend/` directory)
- **Routing:** React Router v6 — routes in `src/main.jsx`
- **State:** Zustand — `src/store/useAuthStore.js`
- **Backend:** Supabase JS SDK — client in `src/lib/supabase.js`
- **Styles:** Global CSS from `src/styles/` (existing WEDA gold/void dark theme — do not change)
- **Secrets:** Supabase URL/key in `.env.local` only — never commit

---

## Tooling

- Node.js 18+

## Local checks (required before PR)

- `node frontend/scripts/a11y-lint.mjs`
- `node frontend/scripts/perf-smoke.mjs` (total bytes ≤ 25KB)

## CI

- GitHub Actions runs the same checks on PRs (see .github/workflows/fe-a11y-perf.yml)

## Standards

- Accessibility: labels for inputs, visible focus, semantic landmarks
- Performance: keep initial payload minimal; add budgets when assets grow
- Commit messages: Conventional style (feat:, fix:, chore:, docs:, ci:)
