// Shared helpers for the end-to-end tests. These talk directly to the Hasura
// admin-secret SQL endpoint for test-account setup/teardown — not the public
// signup API — because Nhost's Auth service rate-limits signup/signin per IP
// (see PROJECT_HANDOFF.md), and a test suite meant to be run repeatedly would
// trip that limit fast if every test signed up for real. The one exception is
// the registration test itself, which exists specifically to exercise the
// real signup + email-verification-link flow.
import bcrypt from "bcryptjs";

const SUBDOMAIN = process.env.NHOST_SUBDOMAIN || "yywxtheekjcruhephgqw";
const REGION = process.env.NHOST_REGION || "eu-central-1";
const ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

const HASURA_URL = `https://${SUBDOMAIN}.hasura.${REGION}.nhost.run`;
const AUTH_URL = `https://${SUBDOMAIN}.auth.${REGION}.nhost.run`;

if (!ADMIN_SECRET) {
  throw new Error(
    "HASURA_ADMIN_SECRET is not set. These tests need it to create/clean up test accounts directly " +
      "(see tests/README.md for where to find it and why the public signup API isn't used for this)."
  );
}

async function runSql(sql) {
  const res = await fetch(`${HASURA_URL}/v2/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hasura-admin-secret": ADMIN_SECRET },
    body: JSON.stringify({ type: "run_sql", args: { source: "default", sql } }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`run_sql failed: ${JSON.stringify(body.error)}`);
  return body.result; // [[col1, col2, ...], [row1val1, row1val2, ...], ...]
}

const TEST_PASSWORD = "TestPass123!";

// Creates a real, usable account bypassing the rate-limited signup endpoint —
// the on_auth_user_created trigger still fires, so `profiles` gets created
// exactly as if they'd signed up for real (see PROJECT_HANDOFF.md).
async function createTestUser(email, displayName) {
  const hash = bcrypt.hashSync(TEST_PASSWORD, 10);
  await runSql(
    `INSERT INTO auth.users (email, password_hash, display_name, email_verified, locale, default_role) ` +
      `VALUES ('${email}', '${hash}', '${displayName}', true, 'en', 'user');`
  );
}

async function makeAdmin(email) {
  await runSql(
    `UPDATE public.profiles SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = '${email}');`
  );
}

// Deletes accounts ONE AT A TIME, never in a single multi-row statement — see
// issue #34: deleting multiple members of the same lobby in one SQL statement
// can corrupt lobbies.organizer_id, since the reassignment trigger only sees
// the membership list as it stood at that single row's delete time.
async function deleteTestUsers(emails) {
  for (const email of emails) {
    await runSql(`DELETE FROM auth.users WHERE email = '${email}';`);
  }
}

async function cleanupOrphanedTestData() {
  // Best-effort: removes lobbies/games/posts left ownerless by the deletes
  // above (e.g. a lobby whose last member was just deleted). Never touches
  // rows tied to a still-existing user. `games` cascades to `game_rounds`
  // (ON DELETE CASCADE), so deleting an orphaned lobby's games is enough —
  // but posts are ON DELETE NO ACTION from game_rounds (see #33), so a post
  // still referenced by ANY game round — including a real, non-orphaned one
  // from a long-since-deleted account, which is legitimate history, not test
  // debris — must never be swept up by a blanket "submitted_by IS NULL" check.
  await runSql(`DELETE FROM public.games WHERE lobby_id IN (SELECT id FROM public.lobbies WHERE organizer_id IS NULL AND created_by IS NULL);`);
  await runSql(`DELETE FROM public.lobbies WHERE organizer_id IS NULL AND created_by IS NULL;`);
  await runSql(`DELETE FROM public.posts WHERE submitted_by IS NULL AND id NOT IN (SELECT post_id FROM public.game_rounds);`);
}

async function getVerificationTicket(email) {
  const result = await runSql(`SELECT ticket FROM auth.users WHERE email = '${email}';`);
  return result[1][0]; // result[0] is the column header row
}

// Resolves a signup's email-verification ticket to the refreshToken query
// param the real email link would redirect to — see app.js's
// completeEmailVerificationFromUrl, which is what actually consumes this.
async function resolveVerificationRedirect(ticket, redirectTo) {
  const url = new URL(`${AUTH_URL}/v1/verify`);
  url.searchParams.set("ticket", ticket);
  url.searchParams.set("type", "emailVerify");
  url.searchParams.set("redirectTo", redirectTo);
  const res = await fetch(url, { redirect: "manual" });
  const location = res.headers.get("location");
  if (!location) throw new Error(`/v1/verify did not redirect (status ${res.status})`);
  return location;
}

export {
  TEST_PASSWORD,
  AUTH_URL,
  runSql,
  createTestUser,
  makeAdmin,
  deleteTestUsers,
  cleanupOrphanedTestData,
  getVerificationTicket,
  resolveVerificationRedirect,
};
