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

const lobbyModeButtons = document.querySelectorAll("#home .switcher button");
const joinLobbyForm = document.getElementById("joinLobbyForm");
const joinCodeInput = document.getElementById("joinCode");
const joinBtn = document.getElementById("joinBtn");
const joinError = document.getElementById("joinError");
const createLobbyForm = document.getElementById("createLobbyForm");
const lobbyNameInput = document.getElementById("lobbyName");
const createBtn = document.getElementById("createBtn");
const createError = document.getElementById("createError");

const lobbyPanel = document.getElementById("lobby");
const lobbyHeaderName = document.getElementById("lobbyHeaderName");
const lobbyCodeBadge = document.getElementById("lobbyCodeBadge");
const lobbyError = document.getElementById("lobbyError");
const lobbyWaiting = document.getElementById("lobbyWaiting");
const waitingMemberList = document.getElementById("waitingMemberList");
const startGameBtn = document.getElementById("startGameBtn");
const leaveWaitingBtn = document.getElementById("leaveWaitingBtn");
const waitingFooterNote = document.getElementById("waitingFooterNote");

const lobbyGame = document.getElementById("lobbyGame");
const videoLeaveBtn = document.getElementById("videoLeaveBtn");
const roundTracker = document.getElementById("roundTracker");
const videoEmbedIframe = document.getElementById("videoEmbedIframe");
const videoFallbackLink = document.getElementById("videoFallbackLink");
const waitingOverlay = document.getElementById("waitingOverlay");
const waitingRows = document.getElementById("waitingRows");
const stampCorrect = document.getElementById("stampCorrect");
const stampWrong = document.getElementById("stampWrong");
const guessSheet = document.getElementById("guessSheet");
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

// --- Restore session on load ---
applySession(nhost.getUserSession());
if (currentSession) {
  refreshIsAdmin();
  goToTab("submit");
}

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
    return err.body.errors[0].message;
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
    const { body } = await nhost.graphql.request({
      query: `mutation($url: String!) { insert_posts_one(object: {video_url: $url}) { id } }`,
      variables: { url },
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

function showPanel(id) {
  panels.forEach((p) => p.classList.toggle("active", p.id === id));
}

function enterLobby(lobbyId) {
  currentLobby = { id: lobbyId };
  lobbyError.style.display = "none";
  lastShownRoundId = null;
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
      query: `query($code: String!) { find_lobby_by_code(args: {code: $code}) { id name is_open } }`,
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
      query: `mutation($name: String!) { insert_lobbies_one(object: {name: $name}) { id } }`,
      variables: { name },
    });
    createLobbyForm.reset();
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
          id code name organizer_id is_open
          members(order_by: {joined_at: asc}) { user_id member { displayName } }
        }
        games(where: {lobby_id: {_eq: $id}}, order_by: {started_at: desc}, limit: 1) {
          id round_count finalized_at
          rounds(order_by: {round_number: asc}) {
            id round_number revealed_at is_my_video
            post { video_url }
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
  waitingFooterNote.textContent = amOrganizer
    ? "As Organizer, you decide when the game begins — everyone else is waiting on you. A game runs up to 8 rounds, depending on how many videos are in the pool."
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
  const id = extractTikTokVideoId(round.post.video_url);
  if (id) {
    videoEmbedIframe.src = `https://www.tiktok.com/embed/v2/${id}`;
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

  stampCorrect.classList.remove("show");
  stampWrong.classList.remove("show");
  guessSheet.classList.remove("open");
  waitingOverlay.style.display = "none";
  miniStandingsWrap.style.display = "none";

  if (revealed) {
    if (myGuess) {
      (myGuess.correct ? stampCorrect : stampWrong).classList.add("show");
    }
    miniStandingsWrap.style.display = "block";
    renderStandingsList(miniStandings, game.rounds.filter((r) => r.revealed_at));
  } else if (round.is_my_video) {
    waitingOverlay.style.display = "block";
    waitingRows.innerHTML = `<div class="waiting-row">This one's yours — sit back while the group guesses.</div>`;
  } else if (myGuess) {
    waitingOverlay.style.display = "block";
    waitingRows.innerHTML = `<div class="waiting-row">Guess locked in — waiting on the rest of the group&hellip;</div>`;
  } else {
    guessSheet.classList.add("open");
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

async function loadAdminPanel() {
  adminError.style.display = "none";
  try {
    const { body } = await adminRequest(`query {
      lobbies(where: { is_open: { _eq: true } }) { id code name organizer_id }
      lobby_members { lobby_id user_id }
      users { id displayName avatarUrl email }
      posts { id video_url submitted_by }
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
      const memberCount = adminMembers.filter((m) => m.lobby_id === lob.id).length;
      const name = lob.name || "Unnamed Lobby";
      return `<div class="admin-row">
        <div>${name}<span class="admin-meta">CODE: ${lob.code} &middot; ${memberCount} member${memberCount === 1 ? "" : "s"}</span></div>
        <button class="btn secondary small admin-close-lobby-btn" data-lobby-id="${lob.id}">Close</button>
      </div>`;
    })
    .join("");
}

adminLobbyList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".admin-close-lobby-btn");
  if (!btn) return;
  btn.disabled = true;
  try {
    await adminRequest(`mutation($lobbyId: uuid!) { delete_lobby_members(where: { lobby_id: { _eq: $lobbyId } }) { affected_rows } }`, {
      lobbyId: btn.dataset.lobbyId,
    });
    await loadAdminPanel();
  } catch (err) {
    adminError.textContent = errorMessageFrom(err);
    adminError.style.display = "block";
    btn.disabled = false;
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
                <div>${p.video_url}<span class="admin-meta">Submitted by ${u.displayName}</span></div>
                <button class="btn secondary small admin-remove-btn" data-post-id="${p.id}">Delete</button>
              </div>`
            )
            .join("")
        : `<div class="admin-evidence-empty">No videos submitted yet.</div>`;
      return `<div class="admin-person${expanded ? " expanded" : ""}" data-user-id="${u.id}">
        <div class="admin-row admin-row-clickable">
          <div><span class="admin-inline-avatar avatar-you">${initial}</span>${u.displayName}<span class="admin-meta">${lobbyCount} active lobby${lobbyCount === 1 ? "" : "s"} &middot; ${posts.length} video${posts.length === 1 ? "" : "s"} submitted</span></div>
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
      await adminRequest(`mutation($id: uuid!) { delete_posts_by_pk(id: $id) { id } }`, { id: deleteVideoBtn.dataset.postId });
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
  loadAdminPanel();
});
