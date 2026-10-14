# Bestefar ecosystem — read this first

This repo (`backend`) is one of **three independent projects** that together make up Per Olav's Bestefar.no / quiz-generator system, all living as sibling folders under `~/Per Olav Projects/`:

| Folder | What it is | Repo | Deploys to |
|---|---|---|---|
| `frontend` | React/Vite "Bestefar HTML Generator" — internal tool where quizzes (AudioQuiz, ImageQuiz, ImageMusic, Crossword) are authored | `ayaz815/bestefar-backend.git` ⚠️ **misconfigured** — this is the wrong remote, it points at the backend's repo, not a frontend repo. Flag this to the user before assuming any push/PR workflow works for frontend. | manual build (`npm run build`) + manual upload, no CI |
| `backend` (**this repo**) | Node/Express + MongoDB API that the frontend reads/writes quizzes through, and that `bestefar.no` also calls to read the AudioQuiz catalog | `ayaz815/bestefar-backend.git` | AWS EC2, see below |
| `bestefar.no_website_files_2026-08-22` | The public bestefar.no website — PHP/CodeIgniter, served from shared hosting (one.com) | `ayaz815/Bestefar.no.git` | **manual upload only** via one.com filemanager — nothing auto-deploys, not even after a commit/push. Always tell the user which files changed and need uploading. |

Each project is opened and worked on **independently** (its own VS Code window / its own session) — don't try to treat them as one monorepo or open them together.

## This repo: backend

Express API + MongoDB (Mongoose), deployed to AWS EC2 under pm2.

- Start locally: `npm start` (`node server.js`), or `nodemon server.js` for dev.
- Mongoose connection is **hardcoded** in `config/db.js` (not read from `.env`, despite `.env` also having Mongo vars — those aren't actually used by `connectDB()`). Database name: `bestefar`, cluster `bestefar.oupgqdq.mongodb.net`. Don't duplicate the credential string elsewhere — read it from `config/db.js` when you need it.
- Core model: `models/Form.js` (`Quiz` schema) — one document per quiz, holds `quizName`, `quizInfo`, `quizMusician`, and a `screens[]` array (one entry per quiz page/question).
- Main routes: `routes/formRoutes.js` (AudioQuiz: `/api/forms/...`), plus `routes/imageQuizRoutes.js`, `routes/imageMusicQuizRoutes.js`, `routes/crosswordRoutes.js`, `routes/audioQuizRoutes.js` (an older/parallel audio route, check before assuming `formRoutes.js` is the only audio path).
- `controllers/formController.js` is where the AudioQuiz save/read logic lives — this is also where the frontend's catalog counts and info/musician fields get populated from, for `bestefar.no`'s catalog view to read via `/api/forms/get-all`.

### Production deployment (AWS EC2)

- SSH alias already configured in `~/.ssh/config` on this machine: `ssh bestefar-ec2` (host `13.51.231.77`, user `ubuntu`, key `~/Downloads/bestefarKey.pem`). Use the alias, don't hardcode the IP/key path in scripts.
- App lives at `/home/ubuntu/bestefar-backend` on the server, run under pm2 as process **`bestefar-backend`**.
- Standard deploy sequence (only do this when the user explicitly asks to deploy):
  ```
  git push origin main   # from this local repo, after committing
  ssh bestefar-ec2 "cd /home/ubuntu/bestefar-backend && git pull && npm install --omit=dev && pm2 restart bestefar-backend"
  ```
- Verify after deploying: `ssh bestefar-ec2 "pm2 list"` and tail logs with `ssh bestefar-ec2 "pm2 logs bestefar-backend --lines 30 --nostream"`.

## Workflow rules (strict)

1. **Never push straight to `main`.** Create a feature branch, commit there, and open a PR for review — even for small fixes. Only push directly if the user explicitly says to skip the PR.
2. **Never delete, drop, or bulk-edit data in MongoDB without the user's explicit, per-action permission.** This includes test cleanup — if you create test documents while debugging, say so and confirm before deleting them, every time. Never run anything resembling `deleteMany`, `drop`, or `remove` without being asked.
3. **Log what you ship.** After a feature/fix is merged or deployed, add a line to `CHANGELOG.md` in this repo (create it if missing) so a future session knows what's already been done without re-deriving it from `git log`. Keep entries short: date, one line, PR/commit link if there is one.
4. Don't assume local `.env` values are what's live in production — the deployed `.env` on the EC2 box may differ; check there before assuming.
