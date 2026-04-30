# Handover: Flight Speakers Website

A guide for whoever's inheriting this project. Designed to be read by a non-technical owner *and* by Claude (the AI coding assistant they'll use to make changes). If you're the human, follow the steps in order. If you're Claude reading this for context, jump straight to the **For the AI agent** section at the bottom.

---

## What you're inheriting

Flight Speakers is a speaker booking platform with three faces:

- **Public site** — speaker browsing, AI-powered semantic search, multi-step enquiry form. Lives at `https://flight-speakers-website.vercel.app` (Vercel).
- **Admin panel** — at `/admin`. Login with username `admin` / password `admin`. Used to manage speakers, enquiries, the waitlist, articles, and integration health checks.
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

- Frontend: `https://flight-speakers-website.vercel.app`
- Backend API: `https://flight-speakers-api-516196678853.europe-west2.run.app`
- GitHub: `https://github.com/FlightStudio/flight-speakers-website`
- GCP project: `flight-speakers` (do **not** confuse with `flightstudio`, which is a different colleague's project)

---

## Before you start: don't migrate anything

You're inheriting a fully-wired-up project that lives across GitHub, Vercel, Google Cloud, Klaviyo, and Monday.com — all under the same parent company. **You should not be creating new accounts, new projects, new buckets, new databases, or new domains.** Every piece of infrastructure already exists; your job is to be added as a member to the existing setup so you can keep maintaining it. If you ever feel tempted to "set this up fresh", stop — that's a signal you're going down the wrong path.

The only thing you create from scratch is your **personal GitHub account** (covered next), because GitHub identities are per-person, not per-company.

---

## Step 1: GitHub — account, org, and SSH access

The code lives on GitHub at `https://github.com/FlightStudio/flight-speakers-website`. You'll need an account, you'll need to be added to the FlightStudio organisation, and your computer will need a way to prove it's you when it talks to GitHub. None of this is hard but it's a fiddly first hour. Walk through 1.1 → 1.5 in order.

### 1.1 Create a GitHub account

1. Open `https://github.com/signup` in your browser.
2. Enter your work email address. Use the email you'll keep using for this project — once it's tied to commits in the repo, switching is awkward.
3. Pick a password (let your password manager generate one) and a username. Most people use `firstname-lastname` or `firstinitial-lastname`. Stick to lowercase letters, numbers, and hyphens.
4. Verify the puzzle, click through the onboarding (skip the optional product preferences), and confirm the email link GitHub sends you.

You now have a GitHub account but it can't see the Flight Speakers code yet. That's the next step.

### 1.2 Turn on two-factor authentication (required by the FlightStudio org)

Most company orgs on GitHub require 2FA. The FlightStudio org is one of them, so do this before asking to be added or the invite will be blocked.

1. Top-right avatar → **Settings** → **Password and authentication** in the left sidebar.
2. Scroll to "Two-factor authentication" → **Enable two-factor authentication**.
3. Choose **Set up using an app** (not SMS — apps are more secure and the org may require it).
4. Scan the QR code with an authenticator app (1Password, Authy, Google Authenticator, or your password manager's built-in TOTP feature).
5. Enter the 6-digit code GitHub asks for, then **save the recovery codes somewhere safe**. Print them or paste them into your password manager — if you ever lose your phone you'll need them to get back in.

### 1.3 Get added to the FlightStudio organisation

The repo is private to the FlightStudio org, so even with a GitHub account you can't see it until someone invites you.

1. Send your GitHub **username** (e.g. `j-smith`, not your email) to whoever owns this handover (Diana — `innovation@steven.com`) and ask to be added to the `FlightStudio` org as a member with access to the `flight-speakers-website` repository.
2. GitHub will email you and put a notification on `https://github.com/FlightStudio` once you're invited.
3. Click **Join FlightStudio** in the email (or go to the org page and accept).
4. Test it: visit `https://github.com/FlightStudio/flight-speakers-website` — you should see the code, not a 404.

### 1.4 Set up SSH so your computer can talk to GitHub without a password

Every time you push a change, your computer has to prove to GitHub it's you. The cleanest way is an **SSH key** — a pair of files on your Mac, one secret and one public, that GitHub uses to verify you. Set this up once and you'll never type a password to GitHub again.

> **What an SSH key is, in one sentence:** A long random secret on your Mac (`~/.ssh/id_ed25519`) and its matching public half (`~/.ssh/id_ed25519.pub`). You give GitHub the public half. Your Mac uses the secret half to prove its identity. The secret half never leaves your machine.

Open the **Terminal** app (Cmd-Space, type "Terminal") and copy-paste the commands below in order.

**Step 1 — Generate the key.** Replace the email with the one you used to sign up.

```bash
ssh-keygen -t ed25519 -C "your-github-email@example.com"
```

GitHub asks where to save it — press Enter to accept the default (`~/.ssh/id_ed25519`). It then asks for a passphrase. You can leave it blank for convenience or set one for extra security; if you set one, your Mac's keychain will remember it after the first use.

**Step 2 — Tell macOS's ssh-agent to load the key on every login.**

```bash
eval "$(ssh-agent -s)"
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

If you set a passphrase, you'll be asked for it once. macOS will store it in the keychain so you won't be asked again.

**Step 3 — Copy the public key to your clipboard.**

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

(Nothing visible happens — the public key is now on your clipboard.)

**Step 4 — Add it to your GitHub account.**

1. Open `https://github.com/settings/keys` in your browser.
2. Click **New SSH key**.
3. Title: something like "Macbook Pro 2026" (just so you can identify it later).
4. Key type: leave as **Authentication Key**.
5. Paste into the Key field (Cmd-V). It should start with `ssh-ed25519` and end with your email.
6. Click **Add SSH key**. GitHub will ask you to confirm with your password and 2FA code.

**Step 5 — Test the connection.**

```bash
ssh -T git@github.com
```

The first time, you'll see "The authenticity of host 'github.com' can't be established... Are you sure you want to continue?" — type `yes` and press Enter.

You should then see:

```
Hi <your-username>! You've successfully authenticated, but GitHub does not provide shell access.
```

That message is the success message. Don't worry about "does not provide shell access" — that's just GitHub saying you can't log in to a shell on their server, which is expected.

If instead you see "Permission denied (publickey)", the key didn't get added correctly. Re-do Step 4.

### 1.5 Clone the repo

Now you're authenticated. Clone the project to your machine:

```bash
cd ~/Documents
git clone git@github.com:FlightStudio/flight-speakers-website.git
cd flight-speakers-website
```

The `git@github.com:...` URL is the SSH URL — it must start with `git@`, not `https://`. If you used the `https://` URL by accident, GitHub would ask for a username and password every time. Delete the folder and re-clone with the SSH URL.

### Bonus: Personal Access Token (only if SSH won't work)

If you're on a machine that absolutely won't let you set up SSH (very rare, usually corporate-locked Windows machines), you can use a **Personal Access Token** instead:

1. `https://github.com/settings/tokens` → **Generate new token (classic)**.
2. Note: "flight-speakers website laptop". Expiration: **No expiration**. Scopes: tick `repo` and `workflow`.
3. Generate. **Copy the token immediately** — you can't see it again. Put it in your password manager.
4. When `git push` asks for a password, paste the token instead.

SSH is the cleaner default; tokens are a fallback only.

---

## Step 1B: The other accounts you'll need

These are simpler — usually just "log in with your work Google account" and someone gives you access.

- [ ] **Google Cloud** — Editor role on project `flight-speakers`. Sign in to `https://console.cloud.google.com` with your work email and confirm you can see the project in the picker (top of the page next to the Google Cloud logo). Don't confuse it with `flightstudio` — that's a different team's project and is off-limits.
- [ ] **Vercel** — `https://vercel.com`. Sign in with GitHub (use the account you just made). Ask Diana to invite you to the existing `flight-speakers-website` Vercel project as a member. **Don't create a new Vercel project, don't fork, and don't migrate** — the existing one is already wired to the right environment variables, the production domain, and the auto-deploy from `main`. You're joining the existing setup, not replacing it.
- [ ] **Anthropic Console** — `https://console.anthropic.com`. Sign up, then create your own API key under Settings → API Keys. Used by Claude Code locally; production uses a separate key already wired into Google Secret Manager so you don't need to share keys with anyone.
- [ ] **Monday.com** — `https://flightstory.monday.com` (or your team's URL). Access board `1153323847` ("SB Leads — Speaking Engagements") to see CRM events land when enquiries come in.
- [ ] **Klaviyo** — `https://www.klaviyo.com/login`. Access lists "Flight Speakers — Enquiries" and "Flight Speakers — Newsletter".

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
