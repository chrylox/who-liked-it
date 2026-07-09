// End-to-end tests for "Who Liked It?" — see tests/README.md to run these.
//
// Covers the three things worth testing as real user journeys rather than
// unit-level checks: registering for real (including the email-verification
// link actually signing you in), the core game loop two players would
// actually play, and the Admin panel's destructive actions. Schema/permission
// correctness (triggers, FK behavior, Hasura roles) is covered by direct
// Hasura-level checks during development — see PROJECT_HANDOFF.md's issue
// history (#23, #32, #33) for how those were verified; this file is about
// what a real person clicking through the real UI experiences.
//
// This project's Nhost database is shared with real users (see
// PROJECT_HANDOFF.md) — every selector below is scoped to the specific
// row/lobby a test created, never a bare global selector, since the real
// admin roster/lobby list can and does contain other people's real data.
const { test, expect } = require("@playwright/test");
const {
  TEST_PASSWORD,
  createTestUser,
  makeAdmin,
  deleteTestUsers,
  cleanupOrphanedTestData,
  getVerificationTicket,
  resolveVerificationRedirect,
} = require("./helpers");

// Two of TikTok's own official example videos (from their developer docs) —
// real, stable, existing videos, not placeholder test URLs.
const REAL_VIDEO_A = "https://www.tiktok.com/@scout2015/video/6718335390845095173";
const REAL_VIDEO_B = "https://www.tiktok.com/@zachking/video/6749520869598481669";

// Both the email and the display name carry the same unique suffix, so a
// text-based selector like `hasText: identity.name` can never ambiguously
// match a stale leftover from a previous run or a real person's account.
// The suffix must be digits-only in `name` — Nhost's displayName validation
// pattern (^[\p{L}\p{N}\p{S} ,.'-]+$) rejects underscores, which the real
// signup form (used by the Registration test) would reject with a
// schema-validation-error if the suffix had any.
function uniqueIdentity(label) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  return { email: `e2e_${label}_${suffix}@example.com`, name: `E2E${label}${suffix}` };
}

async function signIn(page, baseURL, email) {
  await page.goto(baseURL);
  await page.fill("#email", email);
  await page.fill("#pass", TEST_PASSWORD);
  await page.click("#enterBtn");
  await page.waitForFunction(() => !document.getElementById("submitTab").classList.contains("tab-locked"), { timeout: 15000 });
}

async function submitVideo(page, url) {
  await page.click('.tab[data-target="submit"]');
  await page.fill("#link", url);
  await page.click("#fileBtn");
  await page.waitForSelector("#submitSuccess", { state: "visible", timeout: 15000 });
}

test.describe("Registration", () => {
  test("registering and clicking the verification link signs you in automatically", async ({ page, baseURL }) => {
    const identity = uniqueIdentity("register");
    await page.goto(baseURL);
    await page.click('.switcher button[data-mode="register"]');
    await page.fill("#name", identity.name);
    await page.fill("#email", identity.email);
    await page.fill("#pass", TEST_PASSWORD);
    await page.click("#enterBtn");
    await expect(page.locator("#checkEmailNotice")).toBeVisible({ timeout: 15000 });

    try {
      const ticket = await getVerificationTicket(identity.email);
      const redirectLocation = await resolveVerificationRedirect(ticket, baseURL + "/");

      await page.goto(redirectLocation);
      await expect(page.locator("#sessionStatus")).toContainText(`Signed in as ${identity.name}`, { timeout: 10000 });
      await expect(page.locator('.tab[aria-selected="true"]')).toHaveAttribute("data-target", "submit");
    } finally {
      await deleteTestUsers([identity.email]).catch(() => {});
    }
  });
});

test.describe("Core game loop", () => {
  test("two players submit videos, play a full game, and see final standings", async ({ browser, baseURL }) => {
    const a = uniqueIdentity("gameA");
    const b = uniqueIdentity("gameB");
    const lobbyName = `E2E Game Loop ${Date.now()}`;
    await createTestUser(a.email, a.name);
    await createTestUser(b.email, b.name);

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      await signIn(pageA, baseURL, a.email);
      await submitVideo(pageA, REAL_VIDEO_A);
      await pageA.click('.tab[data-target="home"]');
      await pageA.click('.switcher button[data-lobbymode="create"]');
      await pageA.fill("#lobbyName", lobbyName);
      await pageA.click("#createBtn");
      await pageA.waitForFunction(() => !document.getElementById("lobbyCodeBadge").textContent.includes("—"), { timeout: 15000 });
      const code = (await pageA.textContent("#lobbyCodeBadge")).replace("CODE: ", "").trim();

      await signIn(pageB, baseURL, b.email);
      await submitVideo(pageB, REAL_VIDEO_B);
      await pageB.click('.tab[data-target="home"]');
      await pageB.fill("#joinCode", code);
      await pageB.click("#joinBtn");
      await pageB.waitForFunction(() => !document.getElementById("lobbyCodeBadge").textContent.includes("—"), { timeout: 15000 });

      await pageA.waitForTimeout(2500); // let A's poll pick up B joining
      await pageA.click("#startGameBtn");
      await pageA.waitForTimeout(2000);

      // Play through both rounds — whichever page currently shows the toggle
      // button is the guesser for that round (the round's own submitter sits
      // out and never shows it). Right after the previous round's reveal,
      // there's a brief window (REVEAL_HOLD_MS in app.js) where NEITHER page
      // shows the toggle yet — a single point-in-time check can catch that
      // transitional moment and wrongly default to whichever page it didn't
      // check, so this polls until one of them actually shows it instead of
      // assuming.
      async function waitForGuesser() {
        for (let waited = 0; waited < 15000; waited += 300) {
          if (await pageA.isVisible("#guessToggleBtn")) return pageA;
          if (await pageB.isVisible("#guessToggleBtn")) return pageB;
          await pageA.waitForTimeout(300);
        }
        throw new Error("Neither page showed #guessToggleBtn — game may be stuck");
      }

      for (let round = 0; round < 2; round++) {
        const guesser = await waitForGuesser();
        await guesser.click("#guessToggleBtn");
        await expect(guesser.locator("#guessSheet")).toHaveClass(/open/);
        await guesser.locator(".suspect-row").first().click();
        await expect(guesser.locator("#guessSheet")).not.toHaveClass(/open/);
        await pageA.waitForTimeout(3000); // reveal + auto-advance
        await pageB.waitForTimeout(500);
      }

      await expect(pageA.locator("#lobbyFinal")).toHaveClass(/active/, { timeout: 15000 });
      await expect(pageA.locator("#finalStandings")).toContainText(a.name);
      await expect(pageA.locator("#finalStandings")).toContainText(b.name);
    } finally {
      // Account/data cleanup first, context closing last, each independently
      // caught — a Playwright test-timeout force-closes contexts already, so
      // ctxA.close() below can throw; that must not skip the cleanup that
      // matters (deleting the test accounts/lobby) the way a single
      // unguarded try/finally would.
      await deleteTestUsers([a.email, b.email]).catch(() => {});
      await cleanupOrphanedTestData().catch(() => {});
      await ctxA.close().catch(() => {});
      await ctxB.close().catch(() => {});
    }
  });
});

test.describe("Admin panel", () => {
  test("admin can moderate a video, close a lobby, and delete an account", async ({ browser, baseURL }) => {
    const admin = uniqueIdentity("admin");
    const player = uniqueIdentity("player");
    const lobbyName = `E2E Admin Target ${Date.now()}`;
    await createTestUser(admin.email, admin.name);
    await createTestUser(player.email, player.name);
    await makeAdmin(admin.email);

    const adminCtx = await browser.newContext();
    const playerCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const playerPage = await playerCtx.newPage();
    adminPage.on("dialog", (dialog) => dialog.accept());

    try {
      await signIn(playerPage, baseURL, player.email);
      await submitVideo(playerPage, REAL_VIDEO_A);
      await playerPage.click('.tab[data-target="home"]');
      await playerPage.click('.switcher button[data-lobbymode="create"]');
      await playerPage.fill("#lobbyName", lobbyName);
      await playerPage.click("#createBtn");
      await playerPage.waitForFunction(() => !document.getElementById("lobbyCodeBadge").textContent.includes("—"), { timeout: 15000 });

      await signIn(adminPage, baseURL, admin.email);
      await adminPage.click('.tab[data-target="admin"]');
      await adminPage.waitForSelector("#adminRoster", { timeout: 15000 });
      await adminPage.waitForTimeout(1000);

      // Scoped to this test's own lobby/row — the real admin lobby list and
      // roster can (and does) contain other real people's data.
      const lobbyRow = adminPage.locator(".admin-row", { hasText: lobbyName });
      const adminRow = adminPage.locator(".admin-person", { hasText: admin.name });
      const playerRow = adminPage.locator(".admin-person", { hasText: player.name });

      await expect(lobbyRow).toBeVisible();
      await expect(playerRow).toBeVisible();

      // Expand the player's row specifically and moderate their video.
      await playerRow.locator(".admin-row-clickable").click();
      await adminPage.waitForTimeout(300);
      await expect(playerRow.locator(".admin-remove-btn")).toHaveCount(1);
      await playerRow.locator(".admin-remove-btn").click();
      await adminPage.waitForTimeout(1000);
      await expect(playerRow).not.toContainText(REAL_VIDEO_A);

      // Close the lobby.
      await lobbyRow.locator(".admin-close-lobby-btn").click();
      await adminPage.waitForTimeout(1000);
      await expect(adminPage.locator("#adminLobbyList")).not.toContainText(lobbyName);

      // Delete the player's account — admin's own row must have no Remove button.
      await expect(adminRow.locator(".admin-remove-person-btn")).toHaveCount(0);
      await expect(playerRow.locator(".admin-remove-person-btn")).toHaveCount(1);
      await playerRow.locator(".admin-remove-person-btn").click();
      await adminPage.waitForTimeout(1500);
      await expect(adminPage.locator("#adminRoster")).not.toContainText(player.name);
    } finally {
      // player.email's account may already be gone (deleted via the UI above)
      // — deleteTestUsers is a no-op DELETE for a row that doesn't exist.
      await deleteTestUsers([player.email, admin.email]).catch(() => {});
      await cleanupOrphanedTestData().catch(() => {});
      await adminCtx.close().catch(() => {});
      await playerCtx.close().catch(() => {});
    }
  });
});
