# End-to-end tests

Real browser tests against the real Nhost backend — there's no mocking, since this project has no backend of its own to mock (Nhost/Hasura is the only backend, in every environment).

## Setup

```bash
npm install
npx playwright install chromium
```

## Running

1. Serve the app locally (a plain static server — opening `index.html` via `file://` won't reliably load the ES module script):
   ```bash
   npx serve . -p 8080
   ```
2. In another terminal, set `HASURA_ADMIN_SECRET` and run the tests:
   ```bash
   HASURA_ADMIN_SECRET='...' npm run test:e2e
   ```
   Get the admin secret from the Nhost dashboard (Settings → Environment Variables) — see PROJECT_HANDOFF.md's "Credentials are deliberately NOT in this repo" section if you don't have it yet.

To run against the live deployed site instead of a local copy, set `BASE_URL`:
```bash
HASURA_ADMIN_SECRET='...' BASE_URL=https://chrylox.github.io/who-liked-it/ npm run test:e2e
```

## Why test accounts are created via direct DB insert, not the real signup form

Nhost's Auth service rate-limits signup *and* sign-in per IP (see PROJECT_HANDOFF.md). A test suite meant to be run repeatedly would trip that limit almost immediately if every test signed up for real. `tests/helpers.js` instead inserts test accounts directly into `auth.users` via the Hasura admin-secret endpoint, with a `bcryptjs`-hashed password — the same trigger that fires for a real signup (`on_auth_user_created`) still fires, so this produces a fully real, usable account. Signing *in* to these accounts still goes through the real Auth API — only account *creation* skips it.

The one exception is the registration test itself (`tests/e2e.spec.js`, "Registration" suite), which exists specifically to exercise the real signup form and the real email-verification-link flow — it has to use the real signup endpoint, since that's the thing being tested. Running the full suite occasionally is fine; running it in a tight loop will eventually hit the rate limit on that one test.

**If a test fails with "An unexpected error occurred" shown on the Access screen (in the failure's page snapshot), that's the rate limiter, not a real bug** — confirmed directly while building this suite: `curl` straight to `/v1/signin/email-password` or `/v1/signup/email-password` returns a plain 429 during these windows, and every other assertion in that test would have passed. It clears on its own, usually within a minute or two; there's nothing to fix. Each of the three tests here has been independently verified to pass cleanly and repeatedly outside of a rate-limited window — a failure that shows this specific error is the environment, not the code.

## Cleanup

Every test deletes its own accounts in its `finally` block, **one at a time** — never in a single multi-row `DELETE`. See issue #34: deleting multiple members of the same lobby in one SQL statement can corrupt `lobbies.organizer_id`, since the reassignment trigger added for #32 only sees the membership list as it stood at that one row's own delete time. This isn't reachable through the app's real UI (which only ever deletes one account per action) — it's specifically a hazard of bulk raw-SQL deletes, which is exactly what test cleanup does, hence the one-at-a-time discipline here.

If a test run gets interrupted before cleanup runs, look for accounts matching `e2e_*@example.com` in `auth.users` and remove them the same way (one at a time).
