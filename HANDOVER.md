# Handover: Flight Speakers Website

A guide for whoever's inheriting this project. Designed to be read by a non-technical owner *and* by Claude (the AI coding assistant they'll use to make changes). If you're the human, follow the steps in order. If you're Claude reading this for context, jump straight to the **For the AI agent** section at the bottom.

---

## What you're inheriting

Flight Speakers is a speaker booking platform with three faces:

- **Public site** — speaker browsing, AI-powered semantic search, multi-step enquiry form. Lives at `https://flightspeakers.com` (Vercel).
- **Admin panel** — at `/admin`. Login with username `admin` / password `admin` (default; rotate after handover). Used to manage speakers, enquiries, the waitlist, articles, and integration health checks.
- **Speaker portals** — magic-link-protected pages where speakers self-serve their profile (`/speaker-portal#<token>`) or block calendar dates (`/speaker-availability#<token>`).

**Stack at a glance**

| Layer | What | Where |
| --- | --- | --- |
| Frontend | React 18 + Vite 7 | Vercel, auto-deploys from `main` |
| Backend API | Express 5 + Node 20 | Google Cloud Run (`flight-speakers-api`, region `europe-west2`) |
| Database | PostgreSQL 16 + pgvector | Google Cloud SQL (`flight-speakers-db`) |
| AI | Anthropic Claude (search, brief parsing) + Voyage AI (embeddings) | API keys in Secret Manager |
| CRM | Klaviyo | Webhook fires on enquiry submit |
| Pipeline | Monday.com | Board item created on enquiry accept |
| Photos | Google Cloud Storage | Bucket `flight-speakers-photos` |
| Social stats | Influencers Club API | Daily 3am cron |

**Production URLs**

- Frontend: `https://flightspeakers.com`
- Backend API: `https://flight-speakers-api-516196678853.europe-west2.run.app`
- GitHub: `https://github.com/FlightStudio/flight-speakers-website`
- GCP project: `flight-speakers` (do **not** confuse with `flightstudio`, which is a different colleague's project)

---

## Step 1: Get the accounts you need

You should already have org access to all of these. If anything's missing, ask whoever handed this over.

- [ ] **GitHub** — push access to `FlightStudio/flight-speakers-website`
- [ ] **Google Cloud** — Editor role on project `flight-speakers`. Sign in to `console.cloud.google.com` with your work email and confirm you can see the project in the picker
- [ ] **Vercel** — collaborator on the `flight-speakers-website` project
- [ ] **Anthropic Console** (`console.anthropic.com`) — for your own Claude API key (used by Claude Code locally; production uses a separate key already wired into Secret Manager)
- [ ] **Monday.com** — access to board `1153323847` ("SB Leads — Speaking Engagements") if you want to see CRM events land
- [ ] **Klaviyo** — access to lists "Flight Speakers — Enquiries" and "Flight Speakers — Newsletter"

---

## Step 2: Set up your machine

Mac is recommended. Install once.

```bash
# Homebrew (if you don't already have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Tooling
brew install git node@20
brew install --cask docker

# Open Docker Desktop once after install (it has to start before docker commands work)
open -a Docker

# Google Cloud CLI (only if you'll deploy the backend yourself)
brew install --cask google-cloud-sdk
gcloud auth login
```

---

## Step 3: Get the code running locally

```bash
# Pick a folder you keep work in (e.g. ~/Documents)
cd ~/Documents
git clone git@github.com:FlightStudio/flight-speakers-website.git
cd flight-speakers-website

# Install JS dependencies
npm install

# Start the local Postgres database in Docker
npm run db:start

# Seed it with the speaker roster + sample enquiries + admin user
npm run db:seed
npm run db:embed            # generates Voyage embeddings (uses VOYAGE_API_KEY)
npm run db:seed-enquiries   # ~30 sample enquiries

# Run the frontend (port 3000) and backend (port 3001) together
npm run dev:all
```

Visit `http://localhost:3000`. Visit `http://localhost:3000/admin` and log in.

### About the `.env` file

The repo has a `.env` file that holds API keys (Anthropic, Voyage, Klaviyo, Monday, Influencers Club, JWT secret, GCS credentials). It's gitignored on purpose — it never goes to GitHub.

Ask the previous owner for their `.env` over a secure channel (1Password, Bitwarden, encrypted Slack DM). If you can't get one, you can rebuild it from Google Secret Manager:

```bash
gcloud secrets list --project=flight-speakers
gcloud secrets versions access latest --secret=<name> --project=flight-speakers
```

The secret names match the env-var names. Save the result as `.env` at the project root.

---

## Step 4: Make changes using Claude

This codebase was built and is maintained by working with Claude as a pair-programmer. The repo has a file called `CLAUDE.md` that documents every file path, every API endpoint, every convention — Claude reads it automatically when you open a session in this directory, so it walks in fully briefed.

### Install Claude Code

Claude Code is the terminal-based AI coding assistant. Visit `https://claude.com/claude-code` for the latest install instructions. On Mac it's typically:

```bash
npm install -g @anthropic-ai/claude-code
```

You'll need an Anthropic API key. Get one from `console.anthropic.com` and follow Claude Code's first-run prompts.

> The Claude Desktop chat app at `claude.ai` is great for asking questions but **cannot edit files on your machine**. For making code changes, use **Claude Code** (the terminal CLI). They're different tools with the same brain.

### Open Claude in this project

```bash
cd ~/Documents/flight-speakers-website
claude
```

You'll get an interactive prompt. Claude has already loaded:
- `CLAUDE.md` (the canonical architecture / conventions doc)
- This `HANDOVER.md`
- The current git state

### Examples of good and bad prompts

| Prompt | Why |
| --- | --- |
| "Add a testimonials section to the homepage between the speaker grid and the social proof bar." | Specific where, specific what. Claude can act. |
| "Bump the Voyage AI SDK to its latest version and verify the embedding seed still runs." | Clear scope, clear verification. |
| "Change the homepage hero subhead to 'Curated speakers, AI-matched briefs.'" | Drop-in copy edit, leaves no ambiguity. |
| "Make it look better." | Too vague — Claude will ask follow-ups instead of acting. |
| "Refactor everything." | Will be politely refused. |

Paste **screenshots** when something looks wrong. Claude reads images and is much faster at fixing UI issues with a picture than a description.

### Useful Claude commands inside the session

- `/codex-review` — sends the current diff to OpenAI's Codex for an independent second opinion before you ship
- `/decide <topic>` — Claude researches and records an architectural decision with a dated ADR in `decisions/`
- `/cross-project <query>` — search prior decisions across all projects in `~/Documents`

### What Claude will and won't do automatically

- Will run tests before claiming work is complete
- Will commit each logical step locally with descriptive messages
- Will **not** push to `main` without your explicit approval
- Will **not** deploy to production without your explicit approval ("yes, deploy to production flight-speakers" is the kind of phrase that unlocks it)
- Will refuse to commit secrets

---

## Step 5: Ship a change to production

After Claude has made and committed changes you're happy with:

```bash
# Push to a feature branch (Claude can do this for you)
git checkout -b describe-the-change
git push origin describe-the-change

# Open a PR on GitHub: https://github.com/FlightStudio/flight-speakers-website/pulls
```

Merge to `main` once you're happy.

### Frontend deploys automatically

Vercel watches `main` and rebuilds within ~60 seconds of each merge. You don't have to do anything for frontend-only changes.

### Backend deploys manually

Cloud Run does **not** auto-deploy. After merging a backend change, run:

```bash
gcloud run deploy flight-speakers-api \
  --source . \
  --region europe-west2 \
  --project flight-speakers \
  --quiet
```

Takes 3-5 minutes. Schema migrations in `server/db/migrate.js` apply automatically on first boot of the new revision (idempotent).

You can ask Claude to run this for you — it will check with you first because production deploys are explicit-confirmation actions.

### Rolling back

Cloud Run keeps previous revisions. To revert:
1. Console → Cloud Run → `flight-speakers-api` → Revisions tab
2. Click the previous revision → "Manage Traffic" → 100% to the older one

Frontend rollback: redeploy the previous Vercel deployment from the Vercel dashboard, or revert the Git commit and push.

---

## Step 6: Where to look when something breaks

| Symptom | First place to check |
| --- | --- |
| Site won't load | Vercel dashboard → flight-speakers-website → Deployments tab |
| API errors / 500s | Cloud Console → Cloud Run → `flight-speakers-api` → Logs |
| DB issues | Cloud Console → SQL → `flight-speakers-db` → Operations + Query Insights |
| Klaviyo events not firing | Admin panel → `/admin/integrations` → Klaviyo health check + send test |
| Monday.com items not appearing | Admin panel → `/admin/integrations` → Monday health check |
| Search returning weird results | Run `npm run db:embed` to regenerate embeddings; check Voyage API key |
| Speaker photos not showing | Check the GCS bucket `flight-speakers-photos` is still public-read |
| Magic links broken | Check `speaker_tokens` table; `revoked_at IS NULL AND expires_at > NOW()` should match the link's token |

---

## Step 7: Recently shipped (cut-off ~April 2026)

So you and the agent know what's in flight without re-reading every commit:

- **Speaker self-service availability** — long-lived magic-link calendar at `/speaker-availability#<token>`. Admins generate the link from the speaker detail page in `/admin`. Reflected on the public enquiry form's date picker.
- **Article system** — auto-generated drafts via `articleGenerator.js`, single-textarea editor in admin, public listing at `/news`.
- **Sidebar reorg** — "Speakers" parent now groups Waitlist (intake) and New & Updates (review queue) as sub-items so the funnel reads top-to-bottom.
- **Responsive admin tables** — proper `overflow-x: auto` + `min-width` floor + ellipsis pattern across all admin tables.
- **AI matching demo** — homepage pipeline animation now scales with container queries instead of viewport units, won't squash or wrap pills at narrow widths.
- **Purple removed** — across articles, AI matching pills, and the homepage. Brand palette is now charcoal / accent (orange-red `#E85D4C`) / gold (`#C9A227`) / slate / teal / sky.

Specs and plans for non-trivial features live in `docs/superpowers/specs/` and `docs/superpowers/plans/` respectively.

---

## Step 8: Asking for help

- **Claude itself** — ask Claude in this project. It has all the project context and is the right first stop for "how does X work?"
- **`CLAUDE.md`** — the canonical reference. If Claude ever seems lost about a file path or a convention, point it back to this file.
- **`docs/superpowers/specs/`** — design docs for non-trivial features (e.g. speaker availability, article system).
- **GitHub Issues** — `https://github.com/FlightStudio/flight-speakers-website/issues`
- **Original engineer** — Diana Veletian (`innovation@steven.com`)

---

## For the AI agent (Claude)

You're being handed an existing project. Most of what you need is in `CLAUDE.md` at the root — read it first; it documents every file path, route, schema, and convention. Then read this `HANDOVER.md` for the user's perspective on what they care about.

**Reflexes specific to this codebase**

- Default to the `superpowers:` skills the project uses: `brainstorming` before creative work, `writing-plans` before multi-step coding, `test-driven-development` before implementation, `verification-before-completion` before claiming done.
- The user is **non-technical**. Explain reasoning in plain language. Surface tradeoffs, not jargon. They learn by reading what you write — so narrate the *why* of architectural choices.
- Production deploys are not autonomous. Cloud Run deploys to `flight-speakers` require an explicit "yes, deploy to production" from the user before you run `gcloud run deploy`. Pushing to `main` is fine if they've reviewed the diff; deploying the backend is a separate, explicit step.
- Migrations live in `server/db/migrate.js`, not `init.sql`. The migrate function runs idempotently on every server boot.
- The GCP project is `flight-speakers`. **Never** target `flightstudio` — that's a different team's environment. Always pass `--project flight-speakers` explicitly on every `gcloud` command; never run `gcloud config set project ...` against this user's environment.
- Tokens for speaker portals (`/speaker-portal#…`, `/speaker-availability#…`) ride in URL fragments and POST request bodies, never URL paths. Same convention for any new token-protected route.
- Style: UK English, no em dashes, no emojis in body text, GBP currency. The user prefers concise commit messages with no `Author:` trailer.

**Where the user's preferences are recorded**

`~/.claude/projects/-Users-diana-veletian-Documents-Project-Archive-flight-speakers-website/memory/` (auto-loaded if present). If you can't read it, the gist is: explain recommendations, prefer reading files inline over subagent summaries, simple commit subjects, never touch `flightstudio`.

When in doubt, ask. The user has spent enough time on this codebase to have opinions; surface them by asking before making non-trivial design choices.
