# Who Liked It? — read this first

**Before doing anything else, read [`PROJECT_HANDOFF.md`](./PROJECT_HANDOFF.md) in full.** It's the authoritative "current state and decisions" doc for this project, kept up to date every session — this file is just the entry point and the handful of things worth knowing before you even open that.

## Who you're working with
An IT trainee, new to the job, school-level coding experience plus some basic Java. This is their first real personal project, built with AI help, no prior web/backend experience. **Explain *why*, not just *what*.** Present options with tradeoffs rather than assuming one. Always ask clarifying questions through the question-tool "windows" the harness provides, not as plain text.

## What this is, in one paragraph
A small multiplayer party game inspired by a TikTok of friends arguing over who liked a video in a shared "Liked" tab. Players secretly submit links to videos they've liked into their own private pool; a lobby draws them round by round and everyone guesses who submitted each one. Plain HTML/CSS/JS frontend (no framework, no build step), Nhost (Hasura + Postgres + Auth) as the entire backend, deployed free on GitHub Pages at **https://chrylox.github.io/who-liked-it/**.

## Don't assume — verify
- **A successful `git push` does not mean the live site updated.** GitHub Pages' deploy workflow gets cancelled if a new commit lands while a previous build is still in-flight — several rapid pushes in a row can leave every deploy attempt cancelled, silently, while the live site sits on stale code. After pushing, check the Actions run actually completed (not just "queued"/"cancelled"), and confirm by fetching the deployed `app.js`/`style.css` directly and grepping for something unique to your change.
- **This sandbox has no network access to any `tiktok.com` subdomain**, confirmed repeatedly. TikTok's actual embed rendering can only be verified by the trainee on a real device/screenshot — don't assume a change "looks right" without asking them to check.
- **Nhost's Auth service rate-limits both signup and sign-in per IP.** A heavy testing day will eventually 429. Create test accounts via direct SQL insert (bcryptjs-hashed password, see `tests/helpers.js`) instead of the real signup endpoint, and test Hasura permissions with the no-JWT impersonation trick (`x-hasura-admin-secret` + `x-hasura-role` + `x-hasura-user-id` sent directly to GraphQL) when you don't need a real browser session.
- **The best bugs in this project were found by actually playing it** with two real browser sessions or live device testing — not by reading the schema. Keep budgeting for that.

## Process rules
- **Every bug and enhancement gets filed as a GitHub issue** on `chrylox/who-liked-it` (label `bug`/`enhancement`), not just mentioned in chat. Verify a close/reopen API call actually landed rather than assuming success.
- **Schema/data changes against the live Nhost project need the trainee's explicit go-ahead each time**, even for something that follows an already-approved pattern — don't chain consent from one live-DB action to the next.
- Clean up any disposable test accounts/lobbies/games you create, unless the trainee has explicitly said to leave data in place for inspection.
- Credentials (`NHOST_PAT`, `HASURA_ADMIN_SECRET`, `GITHUB_TOKEN`) live in `~/.claude/tokens.env` on this machine — never in this repo. Picking this up elsewhere means regenerating them (see `PROJECT_HANDOFF.md` for exactly how/where).
- Checking Nhost deployment/pipeline logs directly (via `NHOST_PAT` → control-plane GraphQL) is pre-authorized — see `PROJECT_HANDOFF.md` and memory for the flow. Stays scoped to logs; the rest of that API's surface (billing, backups, DNS) wasn't authorized for general poking.

## Current state, in short
Fully built and live: auth, self-submission, lobbies, the full round-by-round game engine (fair per-person draw, mid-game-leave handled correctly, sequential guessing, auto-reveal/finalize, replay), Admin panel, AFK-recovery tools. Spotify mode is designed and partially scaffolded (a `spotify_connections` table exists) but **blocked entirely** by a platform-wide freeze on new Spotify Web API integrations since ~January 2026 — don't attempt to build the OAuth flow until that's confirmed lifted. See `PROJECT_HANDOFF.md`'s most recent dated session section for everything else, and the GitHub issue tracker for open items.

Ignore `berserk-cape-research.md`, `iso contractors/`, `screenshots/`, and `links/` in the workspace root — confirmed unrelated to this project.
