import { createClient } from "https://esm.sh/@nhost/nhost-js@4.7.3";

const nhost = createClient({
  subdomain: "yywxtheekjcruhephgqw",
  region: "eu-central-1",
});

// --- DOM references ---
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
const accessTab = document.getElementById("accessTab");
const submitTab = document.getElementById("submitTab");
const homeTab = document.getElementById("homeTab");
const adminTab = document.getElementById("adminTab");

const sessionStatus = document.getElementById("sessionStatus");
const profileCornerBtn = document.getElementById("profileCornerBtn");
const profileCornerInitial = document.getElementById("profileCornerInitial");
const profileDropdown = document.getElementById("profileDropdown");
const profilePicInitial = document.getElementById("profilePicInitial");
const profileNameInput = document.getElementById("profileName");
const profileEmailInput = document.getElementById("profileEmail");
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

function errorMessageFrom(err) {
  return (err && err.body && err.body.message) || (err && err.message) || "Something went wrong. Please try again.";
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
    if (body.errors) throw new Error(body.errors[0].message);
    currentSession.user.displayName = body.data.updateUser.displayName;
    applySession(currentSession);
    profileSavedNote.style.display = "block";
    setTimeout(() => {
      profileSavedNote.style.display = "none";
    }, 1400);
  } catch (err) {
    profileError.textContent = errorMessageFrom(err);
    profileError.style.display = "block";
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
