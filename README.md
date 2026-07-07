# Who Liked It?

A party game for friend groups, inspired by the classic "3 friends arguing over who liked a video in the shared Liked tab" moment on TikTok. Everyone secretly submits links to videos they've personally liked into their own pool. Each round, the app randomly draws one submitted video without saying whose it is, and the group votes on who they think liked it. Once everyone's guessed, the answer is revealed at once and points go to whoever guessed right — 8 rounds per game, then final standings, and the same group of friends can replay endlessly. Players join or create lobbies with a 6-digit code, and an Organizer (whoever created the lobby, with the role transferring if they leave) starts games and manages who's in the waiting room. Since TikTok has no public API for reading someone's Liked Videos or inbox, there's no scraping or burner-account trickery — submission is simply self-service, straight into the app's own database. It's built with plain HTML/CSS/JS on the frontend and Supabase for auth and the database, with no custom backend server needed. Right now this is a personal learning project in the design/prototyping stage: the concept, roles, and schema are fully designed, and a clickable HTML mockup ([`who-liked-it-mockup-v3.html`](./who-liked-it-mockup-v3.html)) exists to preview every screen, but the real Supabase-backed app hasn't been built yet. Full decision history lives in [`PROJECT_HANDOFF.md`](./PROJECT_HANDOFF.md).

## Roles

```mermaid
graph LR
  Root((🎬 Who Liked It?))

  Root --> Guest(🧍 Guest)
  Guest --> G1[📝 Register Account]
  Guest --> G2[🔓 Log In]

  Root --> Player(🧑‍🤝‍🧑 Player)
  Player --> P1[🔑 Join Lobby via 6-Digit Code, blocked while its game is live]
  Player --> P2[➕ Create Lobby]
  Player --> P3[📼 Submit Video: Personal Pool]
  Player --> P4[🗳️ Vote Each Round]
  Player --> P5[🎭 See Reveal: After Everyone Votes]
  Player --> P6[🏆 View Live & Final Standings]
  Player --> P7[⚙️ Edit Profile]
  Player --> P8[🚪 Leave Lobby]

  Root --> Organizer(🕵️ Organizer, per lobby, can transfer)
  Organizer --> O1[🎬 Start Game: 8 Rounds, Resets Standings]
  Organizer --> O2[📣 Invite Players via Code]
  Organizer --> O3[👢 Kick Player, waiting room only]
  Organizer -.->|also has all| Player
  P2 -.->|creator becomes| Organizer
  P8 -.->|organizer leaving hands off to earliest joiner| Organizer
  O3 -.->|not a ban, can rejoin via code| P1

  Root --> Admin(🛡️ Admin, global)
  Admin --> A1[📋 View & Close Any Lobby]
  Admin --> A2[👥 Manage Player Roster]
  Admin --> A3[🗑️ Delete Any Video]
```
