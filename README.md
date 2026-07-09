# Who Liked It?

A party game for friend groups, inspired by the classic "3 friends arguing over who liked a video in the shared Liked tab" moment on TikTok. Everyone secretly submits links to videos they've personally liked into their own pool. Each round, the app randomly draws one submitted video without saying whose it is, and the group votes on who they think liked it. Once everyone's guessed, the answer is revealed at once and points go to whoever guessed right  8 rounds per game, then final standings, and the same group of friends can replay endlessly. Players join or create lobbies with a 6-digit code, and an Organizer (whoever created the lobby, with the role transferring if they leave) starts games and manages who's in the waiting room. Since TikTok has no public API for reading someone's Liked Videos or inbox, there's no scraping or burner-account trickery  submission is simply self-service, straight into the app's own database. It's built with plain HTML/CSS/JS on the frontend and Supabase for auth and the database, with no custom backend server needed. Right now this is a personal learning project in the design/prototyping stage: the concept, roles, and schema are fully designed, and a clickable HTML mockup ([`who-liked-it-mockup-v3.html`](./who-liked-it-mockup-v3.html)) exists to preview every screen, but the real Supabase-backed app hasn't been built yet. Full decision history lives in [`PROJECT_HANDOFF.md`](./PROJECT_HANDOFF.md).

## Roles

```mermaid
graph LR
  Root(([0;97m[0m\ud83c\udfac Who Liked It?))

  Root --> Guest(\ud83e\uddcd Guest)
  Guest --> G1[\ud83d\udcdd Register Account]
  Guest --> G2[\ud83d\udd13 Log In]

  Root --> Player(\ud83e\uddd1\u200d\ud83e\udd1d\u200d\ud83e\uddd1 Player)
  Player --> P1[\ud83d\udd11 Join Lobby via 6-Digit Code, blocked while its game is live]
  Player --> P2[\u2795 Create Lobby]
  Player --> P3[\ud83d\udcfc Submit Video: Personal Pool]
  Player --> P4[\ud83d\uddf3\ufe0f Vote Each Round]
  Player --> P5[\ud83c\udfad See Reveal: After Everyone Votes]
  Player --> P6[\ud83c\udfc6 View Live & Final Standings]
  Player --> P7[\u2699\ufe0f Edit Profile]
  Player --> P8[\ud83d\udeaa Leave Lobby]

  Root --> Organizer(\ud83d\udd75\ufe0f Organizer, per lobby, can transfer)
  Organizer --> O1[\ud83c\udfac Start Game: 8 Rounds, Resets Standings]
  Organizer --> O2[\ud83d\udce3 Invite Players via Code]
  Organizer --> O3[\ud83d\udc62 Kick Player, waiting room only]
  Organizer -.->|also has all| Player
  P2 -.->|creator becomes| Organizer
  P8 -.->|organizer leaving hands off to earliest joiner| Organizer
  O3 -.->|not a ban, can rejoin via code| P1

  Root --> Admin(\ud83d\udee1\ufe0f Admin, global)
  Admin --> A1[\ud83d\udccb View & Close Any Lobby]
  Admin --> A2[\ud83d\udc65 Manage Player Roster]
  Admin --> A3[\ud83d\uddd1\ufe0f Delete Any Video]
```

## [0;97m[0mTesting

This project includes a comprehensive suite of **171 unit tests** that verify the core logic of the application.

### Running Tests

```bash
# Install dependencies (one-time)
npm install

# Run all tests
npm test

# Run in watch mode (re-runs on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npx jest __tests__/utils.test.js

# Run tests matching a pattern
npx jest --testNamePattern="extractTikTokVideoId"
```

### Test Coverage

- **Error Handling**: GraphQL error message extraction, constraint violation detection
- **URL Utilities**: TikTok URL validation, video ID extraction, short link detection
- **Game Logic**: Round management, standings calculation, lobby state detection
- **Link Resolution**: Redirect following, video ID extraction from resolved URLs

See [`__tests__/README.md`](./__tests__/README.md) for detailed documentation.

### Test Files

| File | Tests | Description |
|------|-------|-------------|
| `__tests__/utils.test.js` | 56 | Error handling, URL parsing, game state utilities |
| `__tests__/tiktok.test.js` | 41 | TikTok URL validation and video ID extraction |
| `__tests__/gameLogic.test.js` | 52 | Round management, standings, lobby state |
| `__tests__/resolve-tiktok-link.test.js` | 22 | Link resolution function logic |

**Total: 171 tests, all passing [0;92m[0m✓[0m**
