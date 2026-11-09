import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const API_URL = "https://mindmirror-backend-b6zj.onrender.com/api/profile";

const PROFILE_STORAGE_KEY = "mindMirrorProfile";
const PROFILE_META_KEY = "mindMirrorProfileMeta";

let currentProfile = {};
let originalProfile = {};

let memberSince = "Not available";
let lastUpdated = "Not updated yet";

let currentUserId = null;

// ==========================================
// USER-SPECIFIC STORAGE KEY
// ==========================================

function getLastUpdatedKey() {
    return `mindMirrorLastUpdated_${currentUserId}`;
}

// ==========================================
// ELEMENTS
// ==========================================

const avatar = document.getElementById("profileAvatar");

const displayName = document.getElementById("profileDisplayName");
const displayUsername = document.getElementById("profileDisplayUsername");

const nameInput = document.getElementById("profileNameInput");
const emailInput = document.getElementById("profileEmailInput");
const usernameInput = document.getElementById("profileUsernameInput");

const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const usernameError = document.getElementById("usernameError");

const completionPercentage = document.getElementById("completionPercentage");
const profileProgress = document.getElementById("profileProgress");

const editButton = document.getElementById("editProfile");
const saveButton = document.getElementById("saveProfile");
const cancelButton = document.getElementById("cancelProfile");

const profileMessage = document.getElementById("profileMessage");

const memberSinceElement = document.getElementById("memberSince");
const lastUpdatedElement = document.getElementById("lastUpdated");

const logoutButton = document.getElementById("logoutButton");
const logoutModal = document.getElementById("logoutModal");

const cancelLogoutButton = document.getElementById("cancelLogout");
const confirmLogoutButton = document.getElementById("confirmLogout");

// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

// ==========================================
// LOAD ACCOUNT METADATA
// ==========================================

function loadMetadata(user) {
    if (!user) {
        return;
    }

    // Member Since comes directly from Firebase Authentication
    if (user.metadata.creationTime) {
        memberSince = formatDate(user.metadata.creationTime);
    } else {
        memberSince = "Not available";
    }

    // Last Updated is stored separately for each Firebase user
    const savedDate = localStorage.getItem(
        getLastUpdatedKey()
    );

    lastUpdated = savedDate || "Not updated yet";

    memberSinceElement.textContent = memberSince;
    lastUpdatedElement.textContent = lastUpdated;
}

// ==========================================
// SAVE LAST UPDATED DATE
// ==========================================

function saveMetadata() {
    if (!currentUserId) {
        return;
    }

    lastUpdated = formatDate(new Date());

    localStorage.setItem(
        getLastUpdatedKey(),
        lastUpdated
    );

    lastUpdatedElement.textContent = lastUpdated;
}

// ==========================================
// GET FIREBASE TOKEN
// ==========================================

async function getToken() {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please log in again.");
    }

    return await user.getIdToken();
}

// ==========================================
// PROFILE API REQUEST
// ==========================================

async function profileRequest(method, data = null) {
    const token = await getToken();

    const options = {
        method,

        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(API_URL, options);

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Profile request failed."
        );
    }

    return result;
}

// ==========================================
// LOAD PROFILE FROM FLASK
// ==========================================

async function loadProfile() {
    try {
        showMessage("Loading profile...", false);

        const result = await profileRequest("GET");

        currentProfile = result.profile || {};

        originalProfile = { ...currentProfile };

        localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(currentProfile)
        );

        // Metadata is already loaded using Firebase user
        displayProfile();

        showMessage("", false);

    } catch (error) {
        console.error("Profile loading error:", error);

        showMessage(
            error.message || "Unable to load profile.",
            true
        );
    }
}

// ==========================================
// DISPLAY PROFILE
// ==========================================

function displayProfile() {
    const name = currentProfile.fullName || "";
    const email = currentProfile.email || "";
    const username = currentProfile.username || "";

    nameInput.value = name;
    emailInput.value = email;
    usernameInput.value = username;

    displayName.textContent = name || "MindMirror User";

    displayUsername.textContent = username
        ? `@${username}`
        : "@username";

    avatar.textContent = getInitials(name);

    updateCompletion();
}

// ==========================================
// GET INITIALS
// ==========================================

function getInitials(name) {
    if (!name) {
        return "MM";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join("");
}

// ==========================================
// PROFILE COMPLETION
// ==========================================

function updateCompletion() {
    const fields = [
        currentProfile.fullName,
        currentProfile.email,
        currentProfile.username
    ];

    const completed = fields.filter(
        field => field && field.trim()
    ).length;

    const percentage = Math.round(
        (completed / fields.length) * 100
    );

    completionPercentage.textContent = `${percentage}%`;

    profileProgress.style.width = `${percentage}%`;
}

// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(message, isError = false) {
    profileMessage.textContent = message;

    profileMessage.classList.toggle(
        "error",
        isError
    );

    profileMessage.classList.toggle(
        "success",
        !isError && message !== ""
    );
}

// ==========================================
// CLEAR VALIDATION ERRORS
// ==========================================

function clearErrors() {
    nameError.textContent = "";
    emailError.textContent = "";
    usernameError.textContent = "";
}

// ==========================================
// ENABLE EDIT MODE
// ==========================================

function enableEditMode() {
    originalProfile = { ...currentProfile };

    nameInput.disabled = false;
    usernameInput.disabled = false;

    // Email editing requires Firebase Auth email update
    emailInput.disabled = true;

    editButton.hidden = true;
    saveButton.hidden = false;
    cancelButton.hidden = false;

    clearErrors();

    showMessage("", false);
}

// ==========================================
// CANCEL EDIT
// ==========================================

function cancelEdit() {
    currentProfile = { ...originalProfile };

    displayProfile();

    disableEditMode();

    showMessage("", false);
}

// ==========================================
// DISABLE EDIT MODE
// ==========================================

function disableEditMode() {
    nameInput.disabled = true;
    emailInput.disabled = true;
    usernameInput.disabled = true;

    editButton.hidden = false;
    saveButton.hidden = true;
    cancelButton.hidden = true;

    clearErrors();
}

// ==========================================
// VALIDATE PROFILE
// ==========================================

function validateProfile() {
    clearErrors();

    const name = nameInput.value.trim();

    const username = usernameInput.value
        .trim()
        .toLowerCase();

    let valid = true;

    if (name.length < 2) {
        nameError.textContent =
            "Please enter your full name.";

        valid = false;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        usernameError.textContent =
            "Username must be 3–20 characters using letters, numbers, or underscores.";

        valid = false;
    }

    return valid;
}

// ==========================================
// SAVE PROFILE
// ==========================================

async function saveProfile() {
    if (!validateProfile()) {
        return;
    }

    const updatedProfile = {
        fullName: nameInput.value.trim(),

        username: usernameInput.value
            .trim()
            .toLowerCase()
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const result = await profileRequest(
            "PUT",
            updatedProfile
        );

        currentProfile.fullName = updatedProfile.fullName;

        currentProfile.username = updatedProfile.username;

        originalProfile = { ...currentProfile };

        localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(currentProfile)
        );

        // Update Last Updated only after successful save
        saveMetadata();

        displayProfile();

        disableEditMode();

        showMessage(
            result.message || "Profile updated successfully.",
            false
        );

    } catch (error) {
        console.error("Profile save error:", error);

        showMessage(
            error.message || "Unable to save profile.",
            true
        );

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "✓ Save Changes";
    }
}

// ==========================================
// LOGOUT MODAL
// ==========================================

function openLogoutModal() {
    logoutModal.hidden = false;
}

function closeLogoutModal() {
    logoutModal.hidden = true;
}

// ==========================================
// LOGOUT
// ==========================================

async function logout() {
    confirmLogoutButton.disabled = true;

    confirmLogoutButton.textContent = "Logging out...";

    try {
        await signOut(auth);

        localStorage.removeItem("mindMirrorLoggedIn");

        localStorage.removeItem(PROFILE_STORAGE_KEY);

        // Remove old shared metadata from previous implementation
        localStorage.removeItem(PROFILE_META_KEY);

        window.location.href = "index.html";

    } catch (error) {
        console.error("Logout error:", error);

        showMessage(
            "Unable to log out. Please try again.",
            true
        );

        closeLogoutModal();

    } finally {
        confirmLogoutButton.disabled = false;

        confirmLogoutButton.textContent = "Log Out";
    }
}

// ==========================================
// BUTTON EVENTS
// ==========================================

editButton.addEventListener(
    "click",
    enableEditMode
);

saveButton.addEventListener(
    "click",
    saveProfile
);

cancelButton.addEventListener(
    "click",
    cancelEdit
);

logoutButton.addEventListener(
    "click",
    openLogoutModal
);

cancelLogoutButton.addEventListener(
    "click",
    closeLogoutModal
);

confirmLogoutButton.addEventListener(
    "click",
    logout
);

// ==========================================
// CLOSE MODAL OUTSIDE
// ==========================================

logoutModal.addEventListener("click", function(event) {
    if (event.target === logoutModal) {
        closeLogoutModal();
    }
});

// ==========================================
// CLOSE MODAL WITH ESCAPE
// ==========================================

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeLogoutModal();
    }
});

// ==========================================
// FIREBASE AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async function(user) {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // Identify the currently logged-in Firebase account
    currentUserId = user.uid;

    // Load account dates for this specific user
    loadMetadata(user);

    console.log("Profile Firebase UID:", user.uid);

    console.log(
        "Firebase Account Created:",
        user.metadata.creationTime
    );

    await loadProfile();
});