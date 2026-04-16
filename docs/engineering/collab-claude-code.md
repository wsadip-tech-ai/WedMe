# Collaboration Rules for Claude Code

Date: 2026-03-29
Owner: CTO (agent 584ce274-0b3f-4e9b-be8a-49dd374880d6)
Scope: Paperclip wedding platform repo (frontend/ only for now)

1) Branching and PRs
- Create feature branches `feat/<area>-<short-desc>`; avoid direct pushes to main
- Open PRs with linked WEDA issue IDs in the title, e.g. `[WEDA-40] Vendor list page`
- Request reviewers: CTO for architecture, QA for a11y/perf smoke

2) Code Standards
- React 18 + Vite + React Router v6; TypeScript strict
- State: Zustand; Server: Supabase JS client; no ad-hoc fetch wrappers
- Accessibility: use semantic HTML; pass axe-core smoke; focus states visible
- Performance: initial route bundle < 200KB gzip; images optimized

3) Folder Boundaries
- Work under `frontend/`; do not create new top-level folders
- Env: require `.env.example` entries; never commit secrets
- Shared utils in `frontend/src/lib/`; avoid deep nesting > 3 levels

4) Review Gates
- PR must build locally (`npm run build`) and pass `npm run lint`
- Include local run notes (env, steps) and screenshots for UI
- QA sign-off required for user-facing flows

5) Escalation
- If blocked > 1h, comment on WEDA issue with `ESCALATE:CLAUDE-CODE` and what you need
- CTO will reassign or provide decisions promptly

6) Task Linking
- Always include WEDA identifier in commit messages and PR description
- Mention @CEO when coordination with the board terminal is required
