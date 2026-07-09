import { createClient } from "https://esm.sh/@nhost/nhost-js@4.7.3";

const nhost = createClient({
  subdomain: "yywxtheekjcruhephgqw",
  region: "eu-central-1",
});

// --- DOM references ---
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
const tabsRow = document.getElementById("tabsRow");
const accessTab = document.getElementById("accessTab");
const submitTab = document.getElementById("submitTab");
const homeTab = document.getElementById("homeTab");
const adminTab = document.getElementById("adminTab");
const adminLobbyListTitle = document.getElementById("adminLobbyListTitle");
const adminLobbyList = document.getElementById("adminLobbyList");
const adminRoster = document.getElementById("adminRoster");
const adminError = document.getElementById("adminError");
const playerSearchInput = document.getElementById("playerSearch");

const sessionStatus = document.getElementById("sessionStatus");
const profileCornerBtn = document.getElementById("profileCornerBtn");
const profileCornerInitial = document.getElementById("profileCornerInitial");
const profileCornerPhoto = document.getElementById("profileCornerPhoto");
const profileDropdown = document.getElementById("profileDropdown");
const profilePicInitial = document.getElementById("profilePicInitial");
const profilePicPhoto = document.getElementById("profilePicPhoto");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const photoInput = document.getElementById("photoInput");
const profileNameInput = document.getElementById("profileName");
const profileEmailInput = document.getElementById("profileEmail");
const changeEmailBtn = document.getElementById("changeEmailBtn");
const emailChangeNotice = document.getElementById("emailChangeNotice");
const profileSavedNote = document.getElementById("profileSavedNote");
const profileError = document.getElementById("profileError");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");

const accessTitle = document.getElementById("accessTitle");
const accessForm = document.getElementById("accessForm");
const accessError = document.getElementById("accessError");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("pass");
const enterBtn = document.getElementById("enterBtn");
const registerField = document.querySelector("[data-register-only]");
const modeButtons = document.querySelectorAll("#access .switcher button");

const checkEmailNotice = document.getElementById("checkEmailNotice");
const checkEmailAddress = document.getElementById("checkEmailAddress");
const backToSignInBtn = document.getElementById("backToSignInBtn");

const submitForm = document.getElementById("submitForm");
const linkInput = document.getElementById("link");
const fileBtn = document.getElementById("fileBtn");
const submitError = document.getElementById("submitError");
const submitSuccess = document.getElementById("submitSuccess");
const undoSubmitBtn = document.getElementById("undoSubmitBtn");
const filedUnderName = document.getElementById("filedUnderName");
const filedUnderNameSpotify = document.getElementById("filedUnderNameSpotify");

const poolModeButtons = document.querySelectorAll("#poolModeSwitcher button");
const spotifyConnectBtn = document.getElementById("spotifyConnectBtn");
const spotifyError = document.getElementById("spotifyError");
const spotifySuccess = document.getElementById("spotifySuccess");

// Direct child, not a descendant selector — #createLobbyForm nests its own
// TikTok/Spotify game-mode .switcher inside #home too, which must NOT be
// caught by this Join/Create switcher's click handler.
const lobbyModeButtons = document.querySelectorAll("#home > .switcher button");
const joinLobbyForm = document.getElementById("joinLobbyForm");
const joinCodeInput = document.getElementById("joinCode");
const joinBtn = document.getElementById("joinBtn");
const joinError = document.getElementById("joinError");
const createLobbyForm = document.getElementById("createLobbyForm");
const lobbyNameInput = document.getElementById("lobbyName");
const createModeButtons = document.querySelectorAll("#createModeSwitcher button");
const createBtn = document.getElementById("createBtn");
const createError = document.getElementById("createError");

const lobbyHeaderName = document.getElementById("lobbyHeaderName");
const lobbyCodeBadge = document.getElementById("lobbyCodeBadge");
const lobbyModeBadge = document.getElementById("lobbyModeBadge");
const lobbyError = document.getElementById("lobbyError");
const lobbyWaiting = document.getElementById("lobbyWaiting");
const waitingMemberList = document.getElementById("waitingMemberList");
const startGameBtn = document.getElementById("startGameBtn");
const leaveWaitingBtn = document.getElementById("leaveWaitingBtn");
const waitingFooterNote = document.getElementById("waitingFooterNote");

const lobbyGame = document.getElementById("lobbyGame");
const videoLeaveBtn = document.getElementById("videoLeaveBtn");
const forceRevealBtn = document.getElementById("forceRevealBtn");
const roundTracker = document.getElementById("roundTracker");
const videoEmbedIframe = document.getElementById("videoEmbedIframe");
const videoFallbackLink = document.getElementById("videoFallbackLink");
const videoRemovedNote = document.getElementById("videoRemovedNote");
const waitingOverlay = document.getElementById("waitingOverlay");
const waitingRows = document.getElementById("waitingRows");
const stampCorrect = document.getElementById("stampCorrect");
const stampWrong = document.getElementById("stampWrong");
const videoStage = document.getElementById("videoStage");
const guessSheet = document.getElementById("guessSheet");
const guessToggleBtn = document.getElementById("guessToggleBtn");
const lineup = document.getElementById("lineup");
const miniStandingsWrap = document.getElementById("miniStandingsWrap");
const miniStandings = document.getElementById("miniStandings");

const lobbyFinal = document.getElementById("lobbyFinal");
const finalStandings = document.getElementById("finalStandings");
const playAgainBtn = document.getElementById("playAgainBtn");
const backHomeBtn = document.getElementById("backHomeBtn");

let currentLobby = null;
let currentGameData = null;
let lobbyPollTimer = null;
let lastShownRoundId = null;
let lastGuessableRoundId = null;

// --- Guess sheet: hidden by default so the video isn't cluttered, opened via
// the corner button (or by tapping the dimmed backdrop to close it again). ---
function openGuessSheet() {
  videoStage.classList.add("sheet-open");
  guessSheet.classList.add("open");
}
function closeGuessSheet() {
  videoStage.classList.remove("sheet-open");
  guessSheet.classList.remove("open");
}
guessToggleBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (videoStage.classList.contains("sheet-open")) closeGuessSheet();
  else openGuessSheet();
});
videoStage.addEventListener("click", (e) => {
  if (videoStage.classList.contains("sheet-open") && !guessSheet.contains(e.target)) closeGuessSheet();
});

let currentSession = null;
let isAdmin = false;

// --- Tab switching ---
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("tab-locked")) return;
    tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
    panels.forEach((p) => p.classList.remove("active"));
    tab.setAttribute("aria-selected", "true");
    document.getElementById(tab.dataset.target).classList.add("active");
  });
});
function goToTab(id) {
  document.querySelector(`.tab[data-target="${id}"]`).click();
}

function updateAdminTabVisibility() {
  const show = !!currentSession && isAdmin;
  adminTab.classList.toggle("tab-hidden", !show);
  if (!show && adminTab.getAttribute("aria-selected") === "true") {
    goToTab("home");
  }
}

function updateTabLocks() {
  const signedIn = !!currentSession;
  submitTab.classList.toggle("tab-locked", !signedIn);
  homeTab.classList.toggle("tab-locked", !signedIn);
  accessTab.classList.toggle("tab-hidden", signedIn);
  profileCornerBtn.style.display = signedIn ? "block" : "none";
  updateAdminTabVisibility();
}

// --- Session rendering ---
function applySession(session) {
  currentSession = session;
  if (session) {
    const user = session.user;
    sessionStatus.textContent = `Signed in as ${user.displayName}`;
    sessionStatus.classList.add("signed-in");
    profileNameInput.value = user.displayName;
    profileEmailInput.value = user.email;
    const initial = (user.displayName || "?").charAt(0).toUpperCase();
    profileCornerInitial.textContent = initial;
    profilePicInitial.textContent = initial;
    filedUnderName.textContent = user.displayName;
    filedUnderNameSpotify.textContent = user.displayName;
    applyAvatar(user.avatarUrl);
  } else {
    sessionStatus.textContent = "Not signed in";
    sessionStatus.classList.remove("signed-in");
    profileDropdown.style.display = "none";
  }
  updateTabLocks();
}

async function refreshIsAdmin() {
  if (!currentSession) {
    isAdmin = false;
    updateAdminTabVisibility();
    return;
  }
  try {
    const { body } = await nhost.graphql.request({
      query: "query { profiles { is_admin } }",
    });
    isAdmin = !!(body.data && body.data.profiles[0] && body.data.profiles[0].is_admin);
  } catch (err) {
    isAdmin = false;
  }
  updateAdminTabVisibility();
}

// --- Email verification link lands back here with ?refreshToken=... (Nhost's
// /v1/verify redirect) — exchange it so clicking the link signs you in directly,
// instead of just unlocking sign-in and making you type your password again. ---
async function completeEmailVerificationFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const refreshToken = params.get("refreshToken");
  if (!refreshToken) return false;
  // Strip it (and Nhost's accompanying `type` param) from the URL immediately
  // so a reload/back-navigation can't replay it.
  params.delete("refreshToken");
  params.delete("type");
  const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : "") + window.location.hash;
  window.history.replaceState({}, "", cleanUrl);
  try {
    await nhost.auth.refreshToken({ refreshToken });
    return true;
  } catch (err) {
    accessError.textContent = "That verification link is invalid or has expired. Please sign in instead.";
    accessError.style.display = "block";
    return false;
  }
}

// --- Restore session on load ---
await completeEmailVerificationFromUrl();
applySession(nhost.getUserSession());
if (currentSession) {
  refreshIsAdmin();
  goToTab("submit");
}
await completeSpotifyAuthFromUrl();

// --- Sign in / Register switcher ---
modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const isRegister = btn.dataset.mode === "register";
    registerField.style.display = isRegister ? "block" : "none";
    accessTitle.textContent = isRegister ? "Register" : "Sign In";
    enterBtn.textContent = isRegister ? "Create Account" : "Enter";
    accessError.style.display = "none";
  });
});

// nhost.graphql.request throws (not returns) when the GraphQL response contains
// errors, even on a 200 — the thrown FetchError's `.body` is the full {errors: [...]}
// GraphQL response, not a plain {message}.
function errorMessageFrom(err) {
  if (err && err.body && Array.isArray(err.body.errors) && err.body.errors[0]) {
    const gqlError = err.body.errors[0];
    // A RAISE EXCEPTION inside one of our own Postgres functions (start_game's
    // "need at least 2 players", the guess triggers, etc.) is a message we
    // deliberately wrote for the end user — but Hasura's top-level `message`
    // for these is always the generic "database query error"; the real text
    // only shows up nested in extensions.internal.error.message. Postgres
    // error code P0001 specifically means "a RAISE EXCEPTION was hit", as
    // opposed to e.g. a raw unique-constraint violation, which stays generic
    // on purpose (isConstraintViolation/isPermissionCheckFailure give those
    // their own friendlier text elsewhere rather than showing raw SQL detail).
    const raised = gqlError.extensions && gqlError.extensions.internal && gqlError.extensions.internal.error;
    if (raised && raised.status_code === "P0001" && raised.message) return raised.message;
    return gqlError.message;
  }
  return (err && err.body && err.body.message) || (err && err.message) || "Something went wrong. Please try again.";
}

// True for any unique/primary-key violation (used both for "duplicate video" and
// "already a member of this lobby" — Hasura reports both the same way).
function isConstraintViolation(err) {
  return !!(
    err &&
    err.body &&
    Array.isArray(err.body.errors) &&
    err.body.errors.some((e) => e.extensions && e.extensions.code === "constraint-violation")
  );
}

// True when an insert/update was rejected by a permission's `check` clause
// (e.g. trying to join a lobby that's closed or mid-game).
function isPermissionCheckFailure(err) {
  return !!(
    err &&
    err.body &&
    Array.isArray(err.body.errors) &&
    err.body.errors.some((e) => e.extensions && e.extensions.code === "permission-error")
  );
}

// --- Access form (sign in / register) ---
accessForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  accessError.style.display = "none";
  const isRegister = document.querySelector("#access .switcher button.active").dataset.mode === "register";
  const email = emailInput.value.trim();
  const password = passInput.value;

  enterBtn.disabled = true;
  try {
    if (isRegister) {
      const name = nameInput.value.trim();
      const { body } = await nhost.auth.signUpEmailPassword({
        email,
        password,
        options: name ? { displayName: name } : undefined,
      });
      if (body.session) {
        applySession(body.session);
        await refreshIsAdmin();
        goToTab("submit");
      } else {
        checkEmailAddress.textContent = email;
        accessForm.style.display = "none";
        checkEmailNotice.style.display = "block";
      }
    } else {
      const { body } = await nhost.auth.signInEmailPassword({ email, password });
      if (body.session) {
        applySession(body.session);
        await refreshIsAdmin();
        goToTab("submit");
      } else if (body.mfa) {
        accessError.textContent = "This account requires multi-factor authentication, which isn't supported yet.";
        accessError.style.display = "block";
      }
    }
  } catch (err) {
    accessError.textContent = errorMessageFrom(err);
    accessError.style.display = "block";
  } finally {
    enterBtn.disabled = false;
  }
});

backToSignInBtn.addEventListener("click", () => {
  checkEmailNotice.style.display = "none";
  accessForm.style.display = "block";
  accessForm.reset();
  document.querySelector('#access .switcher button[data-mode="signin"]').click();
});

// --- Log out ---
logoutBtn.addEventListener("click", async () => {
  try {
    if (currentSession) {
      await nhost.auth.signOut({ refreshToken: currentSession.refreshToken });
    }
  } catch (err) {
    // Still clear the local session even if the network call fails.
  }
  nhost.clearSession();
  isAdmin = false;
  applySession(null);
  accessForm.reset();
  accessForm.style.display = "block";
  checkEmailNotice.style.display = "none";
  document.querySelector('#access .switcher button[data-mode="signin"]').click();
  goToTab("access");
});

// --- Profile: save display name ---
saveProfileBtn.addEventListener("click", async () => {
  if (!currentSession) return;
  const name = profileNameInput.value.trim();
  profileError.style.display = "none";
  if (!name) {
    profileError.textContent = "Display name can't be empty.";
    profileError.style.display = "block";
    return;
  }
  try {
    const { body } = await nhost.graphql.request({
      query: `mutation($id: uuid!, $name: String!) {
        updateUser(pk_columns: {id: $id}, _set: {displayName: $name}) { id displayName }
      }`,
      variables: { id: currentSession.user.id, name },
    });
    // A plain mutation on currentSession.user only updates the in-memory copy —
    // it never touches the SDK's persisted session, so the edit would silently
    // revert on the next page load despite the database being correct. Forcing
    // a refresh re-fetches the user and re-persists the session properly.
    applySession(await nhost.refreshSession(0));
    profileSavedNote.style.display = "block";
    setTimeout(() => {
      profileSavedNote.style.display = "none";
    }, 1400);
  } catch (err) {
    profileError.textContent = errorMessageFrom(err);
    profileError.style.display = "block";
  }
});

// --- Change Email (goes through Nhost's own verification flow, not a raw column update) ---
changeEmailBtn.addEventListener("click", async () => {
  if (!currentSession) return;
  profileError.style.display = "none";
  emailChangeNotice.style.display = "none";
  const newEmail = profileEmailInput.value.trim();
  if (!newEmail || newEmail === currentSession.user.email) return;

  changeEmailBtn.disabled = true;
  try {
    await nhost.auth.changeUserEmail({ newEmail });
    emailChangeNotice.textContent = `Check ${newEmail} for a confirmation link to finish changing your email. Your email stays as ${currentSession.user.email} until then.`;
    emailChangeNotice.style.display = "block";
    profileEmailInput.value = currentSession.user.email; // revert the field — the change isn't real yet
  } catch (err) {
    profileError.textContent = errorMessageFrom(err);
    profileError.style.display = "block";
  } finally {
    changeEmailBtn.disabled = false;
  }
});

// --- Avatar: resized client-side into a small data URL, stored directly in
// avatarUrl. (Nhost Storage's file-serving endpoint returned persistent 403s
// despite correct-looking Hasura permissions on storage.files/buckets — see
// PROJECT_HANDOFF.md for what was tried.) A data URL needs no separate
// fetch/auth to display anywhere, sidestepping that entirely.
const AVATAR_SIZE = 128;

function resizeImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (AVATAR_SIZE - w) / 2, (AVATAR_SIZE - h) / 2, w, h);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that image."));
    };
    img.src = objectUrl;
  });
}

function applyAvatar(avatarUrl) {
  const isPhoto = !!(avatarUrl && avatarUrl.startsWith("data:"));
  profileCornerPhoto.src = isPhoto ? avatarUrl : "";
  profileCornerPhoto.style.display = isPhoto ? "block" : "none";
  profilePicPhoto.src = isPhoto ? avatarUrl : "";
  profilePicPhoto.style.display = isPhoto ? "block" : "none";
}

changePhotoBtn.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file || !currentSession) return;
  profileError.style.display = "none";
  changePhotoBtn.disabled = true;
  try {
    const dataUrl = await resizeImageToDataUrl(file);
    await nhost.graphql.request({
      query: `mutation($id: uuid!, $avatarUrl: String!) {
        updateUser(pk_columns: {id: $id}, _set: {avatarUrl: $avatarUrl}) { id }
      }`,
      variables: { id: currentSession.user.id, avatarUrl: dataUrl },
    });
    // See the comment on the display-name save handler — a forced refresh
    // re-persists the session so the change survives a page reload.
    applySession(await nhost.refreshSession(0));
  } catch (err) {
    profileError.textContent = errorMessageFrom(err);
    profileError.style.display = "block";
  } finally {
    changePhotoBtn.disabled = false;
    photoInput.value = "";
  }
});

// --- Submit Video ---
const TIKTOK_URL_PATTERN = /^https?:\/\/([a-z0-9-]+\.)?tiktok\.com\//i;
// TikTok's native "Share > Copy Link" produces one of these short hosts, whose
// URL doesn't contain a numeric video ID at all (e.g. vm.tiktok.com/ZGd9CtUac/)
// — our embed regex can't extract an ID from that, so without resolving it
// first the video silently falls back to a "Watch on TikTok" link instead of
// playing inline. Resolving requires following the redirect server-side (a
// resolve-tiktok-link Nhost Function) since that's opaque to browser JS
// under CORS.
const SHORT_LINK_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);
async function resolveShortLinkIfNeeded(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch (err) {
    return url;
  }
  if (!SHORT_LINK_HOSTS.has(hostname)) return url;
  try {
    const { body } = await nhost.functions.post("/resolve-tiktok-link", { url });
    return body.resolvedUrl || url;
  } catch (err) {
    return url; // best-effort — worst case, same fallback behavior as before this fix
  }
}

let lastSubmittedPostId = null;
let undoHideTimer = null;

submitForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentSession) return;
  submitError.style.display = "none";
  submitSuccess.style.display = "none";
  const url = linkInput.value.trim();
  if (!url) return;

  if (!TIKTOK_URL_PATTERN.test(url)) {
    submitError.textContent = "That doesn't look like a TikTok link.";
    submitError.style.display = "block";
    return;
  }

  fileBtn.disabled = true;
  try {
    const resolvedUrl = await resolveShortLinkIfNeeded(url);
    const { body } = await nhost.graphql.request({
      query: `mutation($url: String!) { insert_posts_one(object: {video_url: $url}) { id } }`,
      variables: { url: resolvedUrl },
    });
    submitForm.reset();
    lastSubmittedPostId = body.data.insert_posts_one.id;
    undoSubmitBtn.style.display = "inline-block";
    submitSuccess.style.display = "block";
    if (undoHideTimer) clearTimeout(undoHideTimer);
    undoHideTimer = setTimeout(() => {
      submitSuccess.style.display = "none";
      lastSubmittedPostId = null;
    }, 15000);
  } catch (err) {
    submitError.textContent = isConstraintViolation(err)
      ? "You've already submitted this exact video."
      : errorMessageFrom(err);
    submitError.style.display = "block";
  } finally {
    fileBtn.disabled = false;
  }
});

undoSubmitBtn.addEventListener("click", async () => {
  if (!lastSubmittedPostId) return;
  const postId = lastSubmittedPostId;
  lastSubmittedPostId = null;
  if (undoHideTimer) clearTimeout(undoHideTimer);
  try {
    await nhost.graphql.request({
      query: `mutation($id: uuid!) { delete_posts_by_pk(id: $id) { id } }`,
      variables: { id: postId },
    });
    submitSuccess.style.display = "none";
  } catch (err) {
    submitError.textContent = errorMessageFrom(err);
    submitError.style.display = "block";
  }
});

// --- Add to Your Pool: TikTok / Spotify switcher ---
poolModeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    poolModeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const isSpotify = btn.dataset.poolmode === "spotify";
    document.querySelector("[data-pool-tiktok]").style.display = isSpotify ? "none" : "block";
    document.querySelector("[data-pool-spotify]").style.display = isSpotify ? "block" : "none";
  });
});

// --- Spotify: Connect + Sync Liked Songs (Authorization Code with PKCE — the
// whole flow runs client-side, no secret needed, matching the rest of this
// project's "no backend server" constraint). Spotify tokens are never
// persisted anywhere (not localStorage, not the DB) — a sync just uses the
// access token in memory for the duration of the fetch, then discards it;
// syncing again later just means reconnecting, which Spotify makes near-
// instant once a user has already approved this app once. ---
const SPOTIFY_CLIENT_ID = "REPLACE_WITH_REAL_SPOTIFY_CLIENT_ID";
const SPOTIFY_REDIRECT_URI = window.location.origin + window.location.pathname;
const SPOTIFY_SCOPE = "user-library-read";
// Soft cap, not a hard platform limit — keeps a single sync fast and bounded
// for someone with a huge library. Surfaced in the UI copy, not silent.
const SPOTIFY_SYNC_CAP = 500;

function base64UrlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateSpotifyCodeVerifier() {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function generateSpotifyCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

spotifyConnectBtn.addEventListener("click", async () => {
  const verifier = generateSpotifyCodeVerifier();
  sessionStorage.setItem("spotify_code_verifier", verifier);
  const challenge = await generateSpotifyCodeChallenge(verifier);
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPE,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
});

async function exchangeSpotifyCode(code, verifier) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error("Spotify rejected that connection attempt. Please try again.");
  return res.json();
}

async function fetchSpotifyLikedSongs(accessToken) {
  const tracks = [];
  let url = "https://api.spotify.com/v1/me/tracks?limit=50";
  while (url && tracks.length < SPOTIFY_SYNC_CAP) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error("Couldn't read your Liked Songs from Spotify.");
    const page = await res.json();
    for (const item of page.items) {
      const t = item.track;
      if (!t) continue; // a track can be removed/region-locked after being liked
      tracks.push({
        track_id: t.id,
        track_name: t.name,
        artist_name: t.artists.map((a) => a.name).join(", "),
        album_art_url: (t.album.images[0] && t.album.images[0].url) || null,
      });
    }
    url = page.next;
  }
  return tracks;
}

async function syncSpotifyLikedSongs(code, verifier) {
  spotifyError.style.display = "none";
  spotifySuccess.style.display = "none";
  spotifyConnectBtn.disabled = true;
  try {
    spotifyConnectBtn.textContent = "Connecting to Spotify…";
    const tokenData = await exchangeSpotifyCode(code, verifier);
    spotifyConnectBtn.textContent = "Reading your Liked Songs…";
    const tracks = await fetchSpotifyLikedSongs(tokenData.access_token);
    if (!tracks.length) {
      spotifySuccess.textContent = "Connected, but no Liked Songs were found on your Spotify account.";
      spotifySuccess.style.display = "block";
      return;
    }
    spotifyConnectBtn.textContent = "Saving to your pool…";
    const { body } = await nhost.graphql.request({
      query: `mutation($tracks: jsonb!) { sync_liked_songs(args: {tracks: $tracks}) { inserted_count } }`,
      variables: { tracks },
    });
    const added = body.data.sync_liked_songs[0].inserted_count;
    const already = tracks.length - added;
    spotifySuccess.textContent =
      `Synced! Added ${added} new song${added === 1 ? "" : "s"}` + (already ? ` (${already} were already in your pool).` : ".");
    spotifySuccess.style.display = "block";
  } catch (err) {
    spotifyError.textContent = errorMessageFrom(err);
    spotifyError.style.display = "block";
  } finally {
    spotifyConnectBtn.disabled = false;
    spotifyConnectBtn.textContent = "Connect Spotify & Sync Liked Songs";
  }
}

// Spotify redirects back here with ?code=...&state=... (or ?error=...) in the
// URL — same "strip immediately, then act" pattern as the email-verification
// link handler above, so a reload/back-navigation can't replay a used code.
async function completeSpotifyAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  if (!code && !error) return;
  const verifier = sessionStorage.getItem("spotify_code_verifier");
  sessionStorage.removeItem("spotify_code_verifier");
  params.delete("code");
  params.delete("state");
  params.delete("error");
  const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : "") + window.location.hash;
  window.history.replaceState({}, "", cleanUrl);

  if (!currentSession) return; // can't sync while signed out; nothing to recover here
  goToTab("submit");
  document.querySelector('#poolModeSwitcher button[data-poolmode="spotify"]').click();
  if (error || !code || !verifier) {
    spotifyError.textContent = "Spotify connection was cancelled or expired. Please try again.";
    spotifyError.style.display = "block";
    return;
  }
  await syncSpotifyLikedSongs(code, verifier);
}

// --- Profile dropdown open/close ---
profileCornerBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
});
document.addEventListener("click", (e) => {
  if (profileDropdown.style.display !== "block") return;
  if (profileDropdown.contains(e.target) || e.target === profileCornerBtn) return;
  profileDropdown.style.display = "none";
});

// --- Lobbies: Join / Create switcher ---
lobbyModeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    lobbyModeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const isCreate = btn.dataset.lobbymode === "create";
    document.querySelector("[data-lobby-join]").style.display = isCreate ? "none" : "block";
    document.querySelector("[data-lobby-create]").style.display = isCreate ? "block" : "none";
  });
});

// --- Create Lobby: TikTok / Spotify game-mode picker (set once at creation,
// never changed after — see createLobbyForm below) ---
let selectedGameMode = "tiktok";
createModeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    createModeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedGameMode = btn.dataset.gamemode;
  });
});

const GAME_MODE_LABELS = { tiktok: "🎬 Who Liked It? (TikTok)", spotify: "🎵 Who Liked the Song? (Spotify)" };

function showPanel(id) {
  panels.forEach((p) => p.classList.toggle("active", p.id === id));
}

function enterLobby(lobbyId) {
  currentLobby = { id: lobbyId };
  lobbyError.style.display = "none";
  lastShownRoundId = null;
  lastGuessableRoundId = null;
  document.body.classList.add("game-active");
  tabsRow.classList.add("hidden");
  showPanel("lobby");
  pollLobby();
  if (lobbyPollTimer) clearInterval(lobbyPollTimer);
  lobbyPollTimer = setInterval(pollLobby, 2000);
}

function exitLobbyView() {
  if (lobbyPollTimer) clearInterval(lobbyPollTimer);
  lobbyPollTimer = null;
  currentLobby = null;
  currentGameData = null;
  lastShownRoundId = null;
  lastGuessableRoundId = null;
  document.body.classList.remove("game-active");
  document.body.classList.remove("round-active");
  tabsRow.classList.remove("hidden");
  goToTab("home");
}

async function leaveLobby() {
  if (!currentLobby || !currentSession) return;
  try {
    await nhost.graphql.request({
      query: `mutation($lobbyId: uuid!, $userId: uuid!) {
        delete_lobby_members_by_pk(lobby_id: $lobbyId, user_id: $userId) { user_id }
      }`,
      variables: { lobbyId: currentLobby.id, userId: currentSession.user.id },
    });
  } catch (err) {
    // Exit locally regardless — if this somehow failed, nothing was lost by leaving the view.
  }
  exitLobbyView();
}

// --- Join Lobby ---
joinLobbyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  joinError.style.display = "none";
  const code = joinCodeInput.value.trim();
  if (!code) return;

  joinBtn.disabled = true;
  try {
    const { body } = await nhost.graphql.request({
      query: `query($code: String!) { find_lobby_by_code(args: {code: $code}) { id name is_open mode } }`,
      variables: { code },
    });
    const found = body.data.find_lobby_by_code[0];
    if (!found) {
      joinError.textContent = "No open lobby with that code.";
      joinError.style.display = "block";
      return;
    }
    try {
      await nhost.graphql.request({
        query: `mutation($lobbyId: uuid!) { insert_lobby_members_one(object: {lobby_id: $lobbyId}) { lobby_id } }`,
        variables: { lobbyId: found.id },
      });
    } catch (err) {
      // Already a member (e.g. stepped away via "Back to Lobbies" after a finished
      // game) — treat as a welcome back, not a failure, since membership never ended.
      if (!isConstraintViolation(err)) throw err;
    }
    joinLobbyForm.reset();
    enterLobby(found.id);
  } catch (err) {
    joinError.textContent = isPermissionCheckFailure(err)
      ? "That lobby's game has already started — try again once it finishes."
      : errorMessageFrom(err);
    joinError.style.display = "block";
  } finally {
    joinBtn.disabled = false;
  }
});

// --- Create Lobby ---
createLobbyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  createError.style.display = "none";
  const name = lobbyNameInput.value.trim() || "Untitled Lobby";

  createBtn.disabled = true;
  try {
    const { body } = await nhost.graphql.request({
      query: `mutation($name: String!, $mode: String!) { insert_lobbies_one(object: {name: $name, mode: $mode}) { id } }`,
      variables: { name, mode: selectedGameMode },
    });
    createLobbyForm.reset();
    createModeButtons.forEach((b) => b.classList.remove("active"));
    document.querySelector('#createModeSwitcher button[data-gamemode="tiktok"]').classList.add("active");
    selectedGameMode = "tiktok";
    enterLobby(body.data.insert_lobbies_one.id);
  } catch (err) {
    createError.textContent = errorMessageFrom(err);
    createError.style.display = "block";
  } finally {
    createBtn.disabled = false;
  }
});

// --- Polling: the single source of truth for everything inside a lobby ---
async function pollLobby() {
  if (!currentLobby) return;
  try {
    const { body } = await nhost.graphql.request({
      query: `query($id: uuid!) {
        lobbies_by_pk(id: $id) {
          id code name mode organizer_id is_open
          members(order_by: {joined_at: asc}) { user_id member { displayName } }
        }
        games(where: {lobby_id: {_eq: $id}}, order_by: {started_at: desc}, limit: 1) {
          id round_count finalized_at
          rounds(order_by: {round_number: asc}) {
            id round_number revealed_at is_my_video
            post { content_type video_url track_id track_name artist_name album_art_url }
            guesses {
              guesser_id guessed_user_id correct
              guesser_account { displayName }
            }
          }
        }
      }`,
      variables: { id: currentLobby.id },
    });
    renderLobby(body.data);
  } catch (err) {
    // A transient poll failure shouldn't tear down the UI — just skip this tick.
  }
}

function showLobbyState(name) {
  const map = { waiting: lobbyWaiting, game: lobbyGame, final: lobbyFinal };
  Object.entries(map).forEach(([key, el]) => el.classList.toggle("active", key === name));
  document.body.classList.toggle("round-active", name === "game");
}

function renderLobby(data) {
  const lob = data.lobbies_by_pk;
  if (!lob) {
    exitLobbyView();
    return;
  }

  const amMember = lob.members.some((m) => m.user_id === currentSession.user.id);
  if (!amMember) {
    exitLobbyView();
    alert("You were removed from this lobby.");
    return;
  }

  currentLobby = lob;
  lobbyHeaderName.textContent = lob.name;
  lobbyCodeBadge.textContent = "CODE: " + lob.code;
  lobbyModeBadge.textContent = GAME_MODE_LABELS[lob.mode] || lob.mode;

  const game = data.games[0] || null;
  currentGameData = game;
  const amOrganizer = lob.organizer_id === currentSession.user.id;

  // Hold briefly on the just-finalized game's last-round reveal before switching
  // to Final Results — otherwise finalize (set in the same trigger as the last
  // round's reveal) would skip straight past showing that final round's stamp.
  const recentlyFinalized = game && game.finalized_at && msSince(game.finalized_at) < REVEAL_HOLD_MS;

  if (!game || (game.finalized_at && !recentlyFinalized)) {
    if (game && game.finalized_at) {
      showLobbyState("final");
      renderStandingsList(finalStandings, game.rounds);
      playAgainBtn.style.display = amOrganizer ? "inline-block" : "none";
    } else {
      showLobbyState("waiting");
      renderWaitingRoom(lob, amOrganizer);
    }
  } else {
    showLobbyState("game");
    renderLiveRound(game, lob);
  }
}

function renderWaitingRoom(lob, amOrganizer) {
  waitingMemberList.innerHTML = "";
  lob.members.forEach((m) => {
    const isMe = m.user_id === currentSession.user.id;
    const isOrg = m.user_id === lob.organizer_id;
    const name = isMe ? "You" : m.member.displayName;
    const initial = (m.member.displayName || "?").charAt(0).toUpperCase();

    const chip = document.createElement("div");
    chip.className = "member-chip";
    chip.innerHTML =
      `<span class="avatar avatar-you">${initial}</span>${name}` +
      (isOrg ? ` <span class="role-badge role-organizer">Organizer</span>` : "");

    if (amOrganizer && !isMe) {
      const kickBtn = document.createElement("button");
      kickBtn.type = "button";
      kickBtn.className = "kick-btn";
      kickBtn.textContent = "×";
      kickBtn.title = "Remove " + m.member.displayName;
      kickBtn.addEventListener("click", () => kickMember(m.user_id));
      chip.appendChild(kickBtn);
    }
    waitingMemberList.appendChild(chip);
  });

  startGameBtn.style.display = amOrganizer ? "inline-block" : "none";
  const poolNoun = lob.mode === "spotify" ? "songs" : "videos";
  waitingFooterNote.textContent = amOrganizer
    ? `As Organizer, you decide when the game begins — everyone else is waiting on you. A game runs up to 8 rounds, depending on how many ${poolNoun} are in the pool.`
    : "Waiting for the Organizer to start the game.";
}

async function kickMember(userId) {
  lobbyError.style.display = "none";
  try {
    await nhost.graphql.request({
      query: `mutation($lobbyId: uuid!, $userId: uuid!) {
        delete_lobby_members_by_pk(lobby_id: $lobbyId, user_id: $userId) { user_id }
      }`,
      variables: { lobbyId: currentLobby.id, userId },
    });
    pollLobby();
  } catch (err) {
    lobbyError.textContent = errorMessageFrom(err);
    lobbyError.style.display = "block";
  }
}

startGameBtn.addEventListener("click", async () => {
  lobbyError.style.display = "none";
  startGameBtn.disabled = true;
  try {
    await nhost.graphql.request({
      query: `mutation($lobbyId: uuid!) { start_game(args: {lobby_id: $lobbyId}) { id } }`,
      variables: { lobbyId: currentLobby.id },
    });
    lastShownRoundId = null;
    lastGuessableRoundId = null;
    pollLobby();
  } catch (err) {
    lobbyError.textContent = errorMessageFrom(err);
    lobbyError.style.display = "block";
  } finally {
    startGameBtn.disabled = false;
  }
});

leaveWaitingBtn.addEventListener("click", leaveLobby);
videoLeaveBtn.addEventListener("click", () => {
  if (confirm("Leave this lobby? This forfeits the current game.")) leaveLobby();
});

forceRevealBtn.addEventListener("click", async () => {
  if (!confirm("Reveal this round now? Anyone who hasn't guessed yet will be treated as not guessing.")) return;
  lobbyError.style.display = "none";
  forceRevealBtn.disabled = true;
  try {
    await nhost.graphql.request({
      query: `mutation($id: uuid!) { force_reveal_round(args: {round_id: $id}) { id } }`,
      variables: { id: forceRevealBtn.dataset.roundId },
    });
    pollLobby();
  } catch (err) {
    lobbyError.textContent = errorMessageFrom(err);
    lobbyError.style.display = "block";
  } finally {
    forceRevealBtn.disabled = false;
  }
});

// --- Live round ---
const REVEAL_HOLD_MS = 4000;

function msSince(isoTimestamp) {
  return Date.now() - new Date(isoTimestamp).getTime();
}

// The current round is the first one still unrevealed, OR one that was JUST
// revealed (within the hold window) so players actually see the stamp/result
// before the view auto-advances to the next round.
function pickCurrentRound(rounds) {
  for (const r of rounds) {
    if (!r.revealed_at || msSince(r.revealed_at) < REVEAL_HOLD_MS) return r;
  }
  return rounds[rounds.length - 1];
}

function extractTikTokVideoId(url) {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

function showVideoForRound(round) {
  if (round.id === lastShownRoundId) return; // don't reload the embed on every poll tick
  lastShownRoundId = round.id;
  if (!round.post) {
    // An admin soft-deleted this round's video (moderation) — it disappears from
    // the `user` role's view (see #33) even though the round itself still exists.
    videoEmbedIframe.style.display = "none";
    videoEmbedIframe.src = "";
    videoFallbackLink.style.display = "none";
    videoRemovedNote.style.display = "block";
    return;
  }
  videoRemovedNote.style.display = "none";

  if (round.post.content_type === "spotify") {
    // Spotify's own track embed — unlike TikTok, no OAuth/login is needed to
    // view it, so every player (regardless of whether THEY connected Spotify)
    // can see it. No caption/submitter info is shown, same "hidden until
    // reveal" guarantee as TikTok's embed player.
    videoStage.classList.add("spotify-mode");
    videoEmbedIframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    videoEmbedIframe.src = `https://open.spotify.com/embed/track/${round.post.track_id}`;
    videoEmbedIframe.style.display = "block";
    videoFallbackLink.style.display = "none";
    return;
  }

  videoStage.classList.remove("spotify-mode");
  videoEmbedIframe.allow = "encrypted-media;";
  const id = extractTikTokVideoId(round.post.video_url);
  if (id) {
    // /player/v1/ is TikTok's dedicated Embed Player. music_info=0&description=0
    // hides its caption/music-info lines. autoplay=1 starts the video without
    // a tap; browsers block unmuted autoplay without a user gesture, so
    // muted=1 is required for autoplay to actually take effect (confirmed
    // this pairing is necessary — autoplay alone silently no-ops). Note: in
    // practice this player still overlays its own like/comment/share icons
    // directly on the video regardless of these params (seen live on-device,
    // contradicting TikTok's own docs) — there's no documented parameter for
    // those, and they're cross-origin content we can't restyle from our CSS.
    videoEmbedIframe.src = `https://www.tiktok.com/player/v1/${id}?music_info=0&description=0&autoplay=1&muted=1`;
    videoEmbedIframe.style.display = "block";
    videoFallbackLink.style.display = "none";
  } else {
    videoEmbedIframe.style.display = "none";
    videoEmbedIframe.src = "";
    videoFallbackLink.href = round.post.video_url;
    videoFallbackLink.style.display = "inline-block";
  }
}

function renderLiveRound(game, lob) {
  const round = pickCurrentRound(game.rounds);
  roundTracker.textContent = `Round ${round.round_number} / ${game.round_count}`;
  showVideoForRound(round);

  const myGuess = round.guesses.find((g) => g.guesser_id === currentSession.user.id);
  const revealed = !!round.revealed_at;
  const amOrganizer = lob.organizer_id === currentSession.user.id;

  // Escape hatch for #38: if someone closes their tab mid-round instead of
  // leaving, nothing ever re-evaluates that round (reveal is purely driven by
  // a fresh guesses INSERT) — with exactly one other eligible guesser also
  // gone, nothing could ever unstick it. Visible independent of which of the
  // three below branches is active, since the organizer/admin viewing this
  // might be in any of them (or have already guessed) while someone ELSE is
  // the one who's stuck.
  forceRevealBtn.style.display = !revealed && (amOrganizer || isAdmin) ? "inline-block" : "none";
  forceRevealBtn.dataset.roundId = round.id;

  stampCorrect.classList.remove("show");
  stampWrong.classList.remove("show");
  waitingOverlay.style.display = "none";
  miniStandingsWrap.style.display = "none";

  if (revealed) {
    closeGuessSheet();
    guessToggleBtn.style.display = "none";
    if (myGuess) {
      (myGuess.correct ? stampCorrect : stampWrong).classList.add("show");
    }
    miniStandingsWrap.style.display = "block";
    renderStandingsList(miniStandings, game.rounds.filter((r) => r.revealed_at));
  } else if (round.is_my_video) {
    closeGuessSheet();
    guessToggleBtn.style.display = "none";
    waitingOverlay.style.display = "block";
    waitingRows.innerHTML = `<div class="waiting-row">This one's yours — sit back while the group guesses.</div>`;
  } else if (myGuess) {
    closeGuessSheet();
    guessToggleBtn.style.display = "none";
    waitingOverlay.style.display = "block";
    waitingRows.innerHTML = `<div class="waiting-row">Guess locked in — waiting on the rest of the group&hellip;</div>`;
  } else {
    // Only reset the sheet to closed the first time THIS round becomes
    // guessable — renderLiveRound runs on every 2s poll, and re-closing it
    // every tick would yank the sheet shut while someone's mid-decision.
    if (round.id !== lastGuessableRoundId) {
      lastGuessableRoundId = round.id;
      closeGuessSheet();
      guessToggleBtn.style.display = "flex";
    }
    renderGuessLineup(lob, round);
  }
}

function renderGuessLineup(lob, round) {
  lineup.innerHTML = "";
  lob.members.forEach((m) => {
    const name = m.user_id === currentSession.user.id ? "You" : m.member.displayName;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suspect-row";
    btn.innerHTML = `${name}<span class="result-icon"></span>`;
    btn.addEventListener("click", () => submitGuess(round.id, m.user_id));
    lineup.appendChild(btn);
  });
}

async function submitGuess(roundId, guessedUserId) {
  lobbyError.style.display = "none";
  try {
    await nhost.graphql.request({
      query: `mutation($roundId: uuid!, $guessedUserId: uuid!) {
        insert_guesses_one(object: {round_id: $roundId, guessed_user_id: $guessedUserId}) { round_id }
      }`,
      variables: { roundId, guessedUserId },
    });
    // Instant feedback — don't wait for the next poll to hide the sheet.
    closeGuessSheet();
    guessToggleBtn.style.display = "none";
    pollLobby();
  } catch (err) {
    lobbyError.textContent = errorMessageFrom(err);
    lobbyError.style.display = "block";
  }
}

// --- Standings (shared by mini-standings and final results) ---
function renderStandingsList(el, rounds) {
  const tally = {};
  rounds.forEach((r) => {
    r.guesses.forEach((g) => {
      if (!tally[g.guesser_id]) {
        tally[g.guesser_id] = { name: g.guesser_account.displayName, correct: 0 };
      }
      if (g.correct) tally[g.guesser_id].correct += 1;
    });
  });
  const standings = Object.values(tally).sort((a, b) => b.correct - a.correct);

  el.innerHTML = "";
  if (!standings.length) {
    el.innerHTML = `<li class="standings-row"><span class="standing-name">No guesses yet.</span></li>`;
    return;
  }
  standings.forEach((s, i) => {
    const initial = (s.name || "?").charAt(0).toUpperCase();
    const li = document.createElement("li");
    li.className = "standings-row" + (i === 0 && s.correct > 0 ? " trophy-highlight" : "");
    li.innerHTML =
      `<span class="rank">${i + 1}</span>` +
      `<span class="avatar avatar-you">${initial}</span>` +
      `<span class="standing-name">${s.name}</span>` +
      `<span class="points">${s.correct}</span>`;
    el.appendChild(li);
  });
}

// --- Final results actions ---
playAgainBtn.addEventListener("click", async () => {
  lobbyError.style.display = "none";
  playAgainBtn.disabled = true;
  try {
    await nhost.graphql.request({
      query: `mutation($lobbyId: uuid!) { start_game(args: {lobby_id: $lobbyId}) { id } }`,
      variables: { lobbyId: currentLobby.id },
    });
    lastShownRoundId = null;
    lastGuessableRoundId = null;
    pollLobby();
  } catch (err) {
    lobbyError.textContent = errorMessageFrom(err);
    lobbyError.style.display = "block";
  } finally {
    playAgainBtn.disabled = false;
  }
});

backHomeBtn.addEventListener("click", () => {
  exitLobbyView(); // membership is untouched — just stop viewing full-screen
});

// --- Admin panel ---
// Uses x-hasura-role: app_admin, granted only to profiles.is_admin=true accounts
// (see issue #23) — plain `user`-role permissions stay scoped (own row / own
// posts / lobby-member-only), so every request here explicitly opts into the
// wider admin role rather than relying on default-role visibility.
function adminRequest(query, variables) {
  return nhost.graphql.request({ query, variables }, { headers: { "x-hasura-role": "app_admin" } });
}

let adminLobbies = [];
let adminMembers = [];
let adminUsers = [];
let adminPosts = [];
let adminExpandedUserId = null;
let adminExpandedLobbyId = null;

async function loadAdminPanel() {
  adminError.style.display = "none";
  try {
    const { body } = await adminRequest(`query {
      lobbies(where: { is_open: { _eq: true } }) { id code name organizer_id }
      lobby_members { lobby_id user_id }
      users { id displayName avatarUrl email }
      posts(where: { deleted_at: { _is_null: true } }) { id content_type video_url track_name artist_name submitted_by }
    }`);
    adminLobbies = body.data.lobbies;
    adminMembers = body.data.lobby_members;
    adminUsers = body.data.users;
    adminPosts = body.data.posts;
    renderAdminLobbies();
    renderAdminRoster();
  } catch (err) {
    adminError.textContent = errorMessageFrom(err);
    adminError.style.display = "block";
  }
}

function renderAdminLobbies() {
  adminLobbyListTitle.textContent = `All Open Lobbies (${adminLobbies.length})`;
  if (!adminLobbies.length) {
    adminLobbyList.innerHTML = `<div class="admin-evidence-empty">No lobbies currently open.</div>`;
    return;
  }
  adminLobbyList.innerHTML = adminLobbies
    .map((lob) => {
      const members = adminMembers.filter((m) => m.lobby_id === lob.id);
      const name = lob.name || "Unnamed Lobby";
      const expanded = adminExpandedLobbyId === lob.id;
      // Fix for #39: an AFK Organizer stranded in the waiting room (tab closed
      // without Leave) never transfers the role — only a real lobby_members
      // DELETE does that. This lets Admin hand it to any current member
      // directly, without the disproportionate "delete their whole account"
      // workaround that was the only lever before.
      const memberRows = members
        .map((m) => {
          const user = adminUsers.find((u) => u.id === m.user_id);
          const name = user ? user.displayName : "(unknown)";
          const isOrganizer = m.user_id === lob.organizer_id;
          return `<div class="admin-row">
            <div>${name}${isOrganizer ? ' <span class="admin-meta">Organizer</span>' : ""}</div>
            ${isOrganizer ? "" : `<button class="btn secondary small admin-make-organizer-btn" data-lobby-id="${lob.id}" data-user-id="${m.user_id}">Make Organizer</button>`}
          </div>`;
        })
        .join("");
      return `<div class="admin-person${expanded ? " expanded" : ""}" data-lobby-id="${lob.id}">
        <div class="admin-row admin-row-clickable">
          <div>${name}<span class="admin-meta">CODE: ${lob.code} &middot; ${members.length} member${members.length === 1 ? "" : "s"}</span></div>
          <div class="admin-row-actions">
            <button class="btn secondary small admin-expand-btn">Manage ${expanded ? "&#9652;" : "&#9662;"}</button>
            <button class="btn secondary small admin-close-lobby-btn" data-lobby-id="${lob.id}">Close</button>
          </div>
        </div>
        <div class="admin-evidence-list" style="display:${expanded ? "block" : "none"};">${memberRows || `<div class="admin-evidence-empty">No members.</div>`}</div>
      </div>`;
    })
    .join("");
}

adminLobbyList.addEventListener("click", async (e) => {
  const closeBtn = e.target.closest(".admin-close-lobby-btn");
  const makeOrgBtn = e.target.closest(".admin-make-organizer-btn");
  const lobbyPerson = e.target.closest(".admin-person");

  if (closeBtn) {
    closeBtn.disabled = true;
    try {
      await adminRequest(`mutation($lobbyId: uuid!) { delete_lobby_members(where: { lobby_id: { _eq: $lobbyId } }) { affected_rows } }`, {
        lobbyId: closeBtn.dataset.lobbyId,
      });
      await loadAdminPanel();
    } catch (err) {
      adminError.textContent = errorMessageFrom(err);
      adminError.style.display = "block";
      closeBtn.disabled = false;
    }
    return;
  }

  if (makeOrgBtn) {
    makeOrgBtn.disabled = true;
    try {
      await adminRequest(
        `mutation($lobbyId: uuid!, $newOrg: uuid!) { admin_reassign_organizer(args: {lobby_id: $lobbyId, new_organizer_id: $newOrg}) { id } }`,
        { lobbyId: makeOrgBtn.dataset.lobbyId, newOrg: makeOrgBtn.dataset.userId }
      );
      await loadAdminPanel();
    } catch (err) {
      adminError.textContent = errorMessageFrom(err);
      adminError.style.display = "block";
      makeOrgBtn.disabled = false;
    }
    return;
  }

  if (lobbyPerson) {
    const lobbyId = lobbyPerson.dataset.lobbyId;
    adminExpandedLobbyId = adminExpandedLobbyId === lobbyId ? null : lobbyId;
    renderAdminLobbies();
  }
});

function renderAdminRoster() {
  const term = playerSearchInput.value.trim().toLowerCase();
  const filtered = adminUsers.filter((u) => (u.displayName || "").toLowerCase().includes(term));

  if (!filtered.length) {
    adminRoster.innerHTML = term
      ? `<p class="admin-evidence-empty">No players match &ldquo;${term}&rdquo;.</p>`
      : `<p class="admin-evidence-empty">No players yet.</p>`;
    return;
  }

  adminRoster.innerHTML = filtered
    .map((u) => {
      const lobbyCount = adminMembers.filter((m) => m.user_id === u.id).length;
      const posts = adminPosts.filter((p) => p.submitted_by === u.id);
      const initial = (u.displayName || "?").charAt(0).toUpperCase();
      const expanded = adminExpandedUserId === u.id;
      const isSelf = currentSession && u.id === currentSession.user.id;
      const videoRows = posts.length
        ? posts
            .map(
              (p) => `<div class="admin-row">
                <div>${p.content_type === "spotify" ? `${p.track_name} &mdash; ${p.artist_name}` : p.video_url}<span class="admin-meta">Submitted by ${u.displayName}</span></div>
                <button class="btn secondary small admin-remove-btn" data-post-id="${p.id}">Delete</button>
              </div>`
            )
            .join("")
        : `<div class="admin-evidence-empty">No videos or songs submitted yet.</div>`;
      return `<div class="admin-person${expanded ? " expanded" : ""}" data-user-id="${u.id}">
        <div class="admin-row admin-row-clickable">
          <div><span class="admin-inline-avatar avatar-you">${initial}</span>${u.displayName}<span class="admin-meta">${lobbyCount} active lobby${lobbyCount === 1 ? "" : "s"} &middot; ${posts.length} item${posts.length === 1 ? "" : "s"} submitted</span></div>
          <div class="admin-row-actions">
            <button class="btn secondary small admin-expand-btn">Manage ${expanded ? "&#9652;" : "&#9662;"}</button>
            ${isSelf ? "" : `<button class="btn secondary small admin-remove-person-btn">Remove</button>`}
          </div>
        </div>
        <div class="admin-evidence-list" style="display:${expanded ? "block" : "none"};">${videoRows}</div>
      </div>`;
    })
    .join("");
}

playerSearchInput.addEventListener("input", renderAdminRoster);

adminRoster.addEventListener("click", async (e) => {
  const removeBtn = e.target.closest(".admin-remove-person-btn");
  const deleteVideoBtn = e.target.closest(".admin-remove-btn");
  const person = e.target.closest(".admin-person");

  if (deleteVideoBtn) {
    deleteVideoBtn.disabled = true;
    try {
      // Soft-delete, not a hard DELETE: a video already drawn into a game round
      // can't be physically removed (game_rounds.post_id references it, ON
      // DELETE NO ACTION, to protect finished games' history) — see #33. Setting
      // deleted_at just hides it from everyone but Admin from here on.
      await adminRequest(`mutation($id: uuid!, $deletedAt: timestamptz!) { update_posts_by_pk(pk_columns: {id: $id}, _set: {deleted_at: $deletedAt}) { id } }`, {
        id: deleteVideoBtn.dataset.postId,
        deletedAt: new Date().toISOString(),
      });
      await loadAdminPanel();
    } catch (err) {
      adminError.textContent = errorMessageFrom(err);
      adminError.style.display = "block";
      deleteVideoBtn.disabled = false;
    }
    return;
  }

  if (removeBtn) {
    const name = person.querySelector(".admin-inline-avatar").nextSibling.textContent;
    const confirmed = window.confirm(
      `Delete ${name}'s account? This removes them from every lobby and deletes everything they've submitted — this can't be undone.`
    );
    if (!confirmed) return;
    try {
      const { body } = await adminRequest(`mutation($id: uuid!) { deleteUsers(where: { id: { _eq: $id } }) { returning { id } } }`, {
        id: person.dataset.userId,
      });
      if (!body.data.deleteUsers.returning.length) {
        adminError.textContent = "That account couldn't be deleted.";
        adminError.style.display = "block";
        return;
      }
      await loadAdminPanel();
    } catch (err) {
      adminError.textContent = errorMessageFrom(err);
      adminError.style.display = "block";
    }
    return;
  }

  if (person) {
    const userId = person.dataset.userId;
    adminExpandedUserId = adminExpandedUserId === userId ? null : userId;
    renderAdminRoster();
  }
});

adminTab.addEventListener("click", () => {
  adminExpandedUserId = null;
  adminExpandedLobbyId = null;
  loadAdminPanel();
});
