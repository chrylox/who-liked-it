// Playwright config for who-liked-it's end-to-end tests. See tests/README.md
// for what these tests need (env vars, a running local server) and how to run them.
export default {
  testDir: "./tests",
  // Generous on purpose: these tests make real network round-trips against
  // the real Nhost backend at every step (2 sign-ins, 2 video submits,
  // lobby create+join, game start, 2s-interval polling through multiple
  // rounds) — nothing here is mocked or sped up.
  timeout: 120000,
  fullyParallel: false, // tests share a live Nhost backend and shouldn't race each other
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8080",
    headless: true,
  },
};
