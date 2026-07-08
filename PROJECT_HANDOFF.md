# Project Handoff: "Who Liked It?"

This file gets a fresh session up to speed on the project. Read it before doing anything else. It describes **current state and decisions**, not history — see git log or GitHub issues for that.

## Who's building this
An IT trainee, new to the job, with school-level coding experience and some basic Java — this is their first real personal project, built as a learning exercise with AI help. **No prior web/backend experience.** Explain *why*, not just *what*. Present options with tradeoffs rather than assuming.

## The idea
Inspired by a TikTok showing friends arguing over who liked a particular video in a shared "Liked Videos" tab — reimagined as a small multiplayer party game. Players secretly submit videos they've liked; the group guesses who submitted each one as it's drawn.

## How the game works
1. Players submit links to videos they've personally liked into their own private pool (never shown back to them — only Admin can see who submitted what).
2. Players join or create a **lobby** via a 6-digit code and land in a waiting room until the Organizer starts a game.
3. A game is a fixed **8 rounds**. Each round draws an unused video from the members' combined pools; everyone guesses who liked it; once everyone's guessed, the answer and updated standings reveal at once.
4. After round 8, final standings show. The same lobby can replay — standings reset to zero each new game.

## Why self-submission (not scraping TikTok)
TikTok has no public API for reading a user's Liked Videos or inbox/DMs. Scraping a logged-in session (directly, or via a shared "burner" account) would violate TikTok's ToS, risk a ban, and rely on fragile private endpoints — ruled out entirely. Instead, each player pastes a link to their own liked video directly into the app (a normal DB write, zero TikTok contact). Owner and submitter are always the same person.

*Possible future enhancement, not MVP:* a PWA Web Share Target so Android/Chrome users can tap Share on a TikTok video and land pre-filled in the submit form (iOS/Safari doesn't support this — manual paste stays as the universal fallback either way).

## Roles
- **Guest** — has an account, not in a lobby yet.
- **Player** — submits videos, joins/creates lobbies, guesses each round, views standings, can leave a lobby.
- **Organizer** — per-lobby (not global). Starts as the creator; if they leave, the role transfers to whoever joined that lobby earliest among the remaining members. Can start games, invite via the join code, and **kick a player — waiting-room only, not mid-game** (not a ban; they can rejoin with the code). Does not manage the video pool — that's Admin's job.
- **Admin** — global, just the trainee's own account (`is_admin` flag). Can view/close any lobby, manage the player roster (including deleting an account entirely — a destructive action, confirmed before it happens), and moderate any submitted video.

Diagram: [`roles-use-cases-diagram.md`](./roles-use-cases-diagram.md) / `.mmd`.

## Lobby lifecycle
Lobbies are temporary — they only exist while they have ≥1 member.
- Leaving/kicking works the same way: remove that person's membership; if they were Organizer, the role transfers per the rule above.
- **Last member leaves → the lobby soft-closes** (`is_open = false`, row kept). Its guesses/points/standings are wiped (always scoped to a live lobby, never persist beyond it) — but every submitted video (`posts`) is preserved permanently, regardless of which lobby held it.
- **No joining mid-game:** once Start Game is clicked, that lobby's code stops working for new members until the game finalizes.

## Tech stack
- **Frontend:** plain HTML/CSS/JS, no framework, no build step.
- **Backend/Auth/DB:** [Nhost](https://nhost.io) — free, open-source Firebase alternative built on Hasura GraphQL + Postgres. Bundles auth + a GraphQL API, both callable directly from frontend JS via `@nhost/nhost-js` — no custom server needed. **Switched from an earlier Supabase plan (2026-07-08)** — same rationale (free, open-source, no credit card), the trainee just ended up signing up with Nhost instead.
- **Hosting:** free static hosting (Netlify/Vercel/GitHub Pages — not chosen yet), online from day one since every friend needs their own device/login.
- **Multi-user:** real per-person accounts, not a shared device.

## Nhost project (created 2026-07-08)
- Organization: `chrylox`. App name: "who liked it". Region: `eu-central-1`. Subdomain: `yywxtheekjcruhephgqw`.
- Live service URLs: GraphQL `https://yywxtheekjcruhephgqw.graphql.eu-central-1.nhost.run/v1`, Auth `https://yywxtheekjcruhephgqw.auth.eu-central-1.nhost.run/v1`, Storage follows the same `https://yywxtheekjcruhephgqw.storage.eu-central-1.nhost.run/v1` pattern. Confirmed live (both GraphQL and Auth respond 200).
- Database is currently empty — no custom tables/permissions yet, just Nhost's defaults. The schema below hasn't been created there yet.
- The trainee's Personal Access Token is stored in `~/.claude/tokens.env` as `NHOST_PAT` (account-level; exchange it for a short-lived access token via the Auth service's `/v1/signin/pat` endpoint before calling the control-plane GraphQL API at `https://otsispdzcwxyqzbfntmj.graphql.eu-central-1.nhost.run/v1` to manage the project itself — separate from the project's own GraphQL API above).

## Database schema (Nhost/Postgres via Hasura, 7 tables)
- **`profiles`** — `id` (→ Nhost Auth user), `display_name`, `is_admin` (bool).
- **`lobbies`** — `id`, `code` (unique 6-digit), `name`, `organizer_id` (→ profiles, mutable/current), `created_by` (→ profiles, immutable/history), `created_at`, `is_open`.
- **`lobby_members`** — `lobby_id`, `user_id`, `joined_at` (drives Organizer-transfer order and "last member left" detection).
- **`posts`** — a submitted video: `submitted_by` (→ profiles, also the owner), video URL, timestamp. No `lobby_id` — it's a personal pool. Never deleted.
- **`games`** — one row per game session in a lobby: `id`, `lobby_id`, `started_at`, `finalized_at` (null while in progress), `round_count` (default 8).
- **`game_rounds`** — `id`, `game_id`, `round_number`, `post_id` (the video drawn, hidden until reveal), `revealed_at`.
- **`guesses`** — `round_id`, `guesser_id`, `guessed_user_id`, `created_at`, `correct` (bool).

Standings = aggregate `guesses.correct` grouped by guesser within one `game_id` — gives "resets every game" and "wiped on lobby close" for free via cascade deletes, while `posts` survive since they don't reference a lobby at all. Admin is derived (`profiles.is_admin`); Organizer is not (`lobbies.organizer_id`, mutable). On Hasura this maps to normal tables + row-level Hasura permissions instead of Postgres RLS policies.

## Current status
- ✅ **Design fully settled** — everything above is decided, not tentative.
- ✅ **Mockup complete and fully interactive**: [`who-liked-it-mockup-v3.html`](./who-liked-it-mockup-v3.html) — open directly in any browser (or on a phone; it's responsive with light/dark auto theming). Covers every screen: sign in/register, submit video, create/join lobbies, full waiting-room → 8-round game → final-standings flow, profile with photo upload, and an Admin tab (roster search, video moderation, delete confirmation, open-lobbies list). Session persists via `localStorage`, mirroring what real Nhost Auth will do.
- ✅ **Repo live** at `github.com/chrylox/who-liked-it`, with this handoff, the mockup, and the roles diagram committed.
- ✅ **Nhost project live** (see above) — organization, app, and both GraphQL/Auth endpoints confirmed working. No schema yet.
- ✅ **Issue tracker set up** — see `github.com/chrylox/who-liked-it/issues` for the backend build roadmap (scaffolding real frontend files, real auth, real Submit Video, real game engine, real Admin panel, deployment) and any open bugs.
- ⏳ **Not started yet: the real Nhost-backed app.** The mockup is a click-through preview only — no real accounts, database, or persistence beyond the browser's `localStorage`.

## How to resume
The Nhost project already exists (see above) — the next step is building the database schema on it (the 7 tables above, plus Hasura permissions per role) — this replaces the old "create Supabase project" issue. After that, work through the remaining open GitHub issues in order — they cover the rest of the build roadmap. Use `who-liked-it-mockup-v3.html` as the reference for how every screen should look and behave.
