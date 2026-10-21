# Changelog

Short, newest-first log of what's actually shipped in this repo, so a new session doesn't have to re-derive it from `git log`. Deploy status matters here since production (AWS EC2) only updates on an explicit `git pull && pm2 restart` — see `CLAUDE.md`.

- **2026-10-15** — Added server-side AudioQuiz PDF generation (`GET /api/forms/pdf/:id`) for the website's "Skriv ut"/print feature - renders the same 3-page PDF (title, participant answer sheet, answer key) the generator's own "Export PDF" produces, ported to plain `React.createElement` at `backend/pdf/*.js`. Briefly deferred (built, reverted, then re-applied same day per the user) - **deployed to EC2**, confirmed live.
- **2026-10-12** — Fixed `quizInfo`/`quizMusician` silently never saving: `page` arrives from multipart form data as the string `"1"`, but the save handler compared it with `page === 1` (strict equality against a number), which was always false. Changed to `Number(page) === 1`. (`66cd3af`) — **deployed to EC2**.
- **2026-10-12** — Added `quizInfo`/`quizMusician` to the `Quiz` schema, the save-form handler, and the `get-all`/`get-by-id` responses, so the generator app and bestefar.no's catalog can read them back. (`78ed929`) — **deployed to EC2**.
- **2026-09-22** — Fixed audio quiz share links returning zero screens for old-model quizzes. (`1dc7bac`)
- **2026-09-17** — Opened CORS fully instead of whitelisting origins; before that, allowed any bestefar.no subdomain instead of exact-match origin. (`821a5d3`, `9004dec`)
- **2026-07-16** — Added the crossword quiz type/API. (`747255a`)
- **2026-06-07 → 2026-06-20** — Built out the ImageMusic quiz API (create, update, "about show" text, screen text). (`5b40b53` … `dd40621`)

Older history: `git log --oneline` for anything before this.
- 2026-10-21 — Add `isPublic` publish flag (drafts hidden from bestefar.no until published); new `/api/visibility/:type/:id` — 7034e67
- 2026-10-22 — PDF generation for BildeQuiz (`/api/image-quiz/pdf/:id`) and crossword (`/api/crossword/pdf/:id`), same layouts as the generator — c93407c
