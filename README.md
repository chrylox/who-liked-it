# Who Liked It?

A party game for friend groups, inspired by the classic "3 friends arguing over who liked a video in the shared Liked tab" moment on TikTok — turned into a small multiplayer web app.

## The idea

Everyone secretly submits links to TikTok videos they've personally liked. During a game, the app randomly draws one submitted video per round — without saying whose it is — and the group votes on who they think liked it. Once everyone's guessed, the answer is revealed and points go to whoever guessed correctly. Repeat for 8 rounds, then see the final standings.

The videos don't need to be embarrassing or scandalous — any liked video works. The fun is the social guessing and reveal, not the content itself.

## How a game works

1. **Submit videos anytime** — paste a link to something you liked into your own personal pool. It's yours and hidden until it's drawn into a game.
2. **Join or create a lobby** with a 6-digit code, together with your friends.
3. **Start a game** — a fixed 8-round session draws from everyone's combined video pools.
4. **Guess each round** — swipe up on the fullscreen video to see the lineup, tap a name to lock in your guess.
5. **Reveal** — once everyone's guessed, the answer and updated standings show at once.
6. **Final results** after round 8 — standings reset every time a new game starts, so the same lobby can replay endlessly.

## Roles

- **Guest** — has an account but isn't in a lobby yet.
- **Player** — submits videos, joins/creates lobbies, votes, and views standings.
- **Organizer** — per-lobby, starts as whoever created it (transfers automatically if they leave); can start games, invite players via the join code, and kick players (waiting room only, not mid-game).
- **Admin** — a single global account (just the developer's own) that can moderate lobbies, the player roster, and submitted videos.

See [`roles-use-cases-diagram.md`](./roles-use-cases-diagram.md) for the full breakdown.

## Why no automation against TikTok itself

There's no public API for reading a TikTok account's Liked Videos or inbox, and scraping a logged-in session would violate TikTok's Terms of Service and risk a ban. So instead of any burner-account or scraping trick, each player just submits their own liked videos directly into the app — fully within our own database, zero risk to anyone's TikTok account.

## Tech stack

- **Frontend:** plain HTML, CSS, and JavaScript — no framework, no build step.
- **Backend, auth, and database:** [Supabase](https://supabase.com) — free, open-source, and gives login/auth plus a Postgres database callable directly from frontend JS, so no custom server is needed.
- **Hosting:** free static hosting (Netlify, Vercel, or GitHub Pages).

## Status

This is a personal learning project, currently in the design/prototyping stage:

- ✅ Concept, roles, game mechanics, and database schema are designed (see [`PROJECT_HANDOFF.md`](./PROJECT_HANDOFF.md) for full detail).
- ✅ A fully interactive HTML mockup exists at [`who-liked-it-mockup-v3.html`](./who-liked-it-mockup-v3.html) — open it directly in any browser to try every screen (sign in, submit videos, lobbies, live rounds, standings, admin panel). It's a clickable preview, not a real backend yet.
- ⏳ Not yet built: the real Supabase-backed app (auth, database, live multiplayer game engine, deployment).

## Files

| File | What it is |
|---|---|
| `who-liked-it-mockup-v3.html` | Interactive click-through mockup of the whole app |
| `PROJECT_HANDOFF.md` | Full design log — every decision made and why, plus what's left to build |
| `roles-use-cases-diagram.md` / `.mmd` | Diagram of roles and what each one can do |
