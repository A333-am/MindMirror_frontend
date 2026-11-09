
import { auth } from "../JS/firebase-config.js";
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// MindMirror - Create Account

const createAccountForm =
    document.getElementById("createAccountForm");

const createMessage =
    document.getElementById("createMessage");

const toggleNewPassword =
    document.getElementById("toggleNewPassword");

const newPassword =
    document.getElementById("newPassword");

// Show / Hide password
if (toggleNewPassword && newPassword) {
    toggleNewPassword.addEventListener("click", function () {
        if (newPassword.type === "password") {
            newPassword.type = "text";
            toggleNewPassword.textContent = "🙈";
        } else {
            newPassword.type = "password";
            toggleNewPassword.textContent = "👁";
        }
    });
}

// Create Firebase account and register username
if (createAccountForm) {
    createAccountForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName =
            document.getElementById("fullName").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const username =
            document.getElementById("newUsername").value.trim().toLowerCase();

        const password =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        createMessage.textContent = "";

        if (!fullName || !email || !username) {
            createMessage.textContent =
                "Please complete all required fields.";
            return;
        }

        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            createMessage.textContent =
                "Username must be 3–20 characters using letters, numbers, or underscores.";
            return;
        }

        if (password.length < 6) {
            createMessage.textContent =
                "Password must contain at least 6 characters.";
            return;
        }

        if (password !== confirmPassword) {
            createMessage.textContent =
                "Passwords do not match.";
            return;
        }

        let user = null;
        let accountCreated = false;

        try {
            createMessage.textContent =
                "Creating your account...";

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            user = userCredential.user;
            accountCreated = true;

            await updateProfile(user, {
                displayName: fullName
            });

            // Get Firebase ID token for backend authentication
            const idToken = await user.getIdToken();

            // Register username in Firestore through Flask
            const response = await fetch(
                "https://mindmirror-backend-b6zj.onrender.com/api/auth/register-username",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        username: username,
                        fullName: fullName
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || result.status !== "success") {
                // Firebase account exists, but username registration failed
                createMessage.textContent =
                    result.message ||
                    "Account created, but username registration failed. Please contact support.";

                return;
            }

            // Store profile details only; never store the password
            const userProfile = {
                uid: user.uid,
                fullName: fullName,
                email: user.email,
                username: username
            };

            localStorage.setItem(
                "mindMirrorProfile",
                JSON.stringify(userProfile)
            );

            createMessage.textContent =
                "Account created successfully!";

            setTimeout(function () {
                window.location.href = "index.html";
            }, 1200);

        } catch (error) {
            console.error("Registration error:", error);

            if (accountCreated) {
                createMessage.textContent =
                    "Your Firebase account was created, but setup did not finish. Please do not create another account; check the error and try again.";
                return;
            }

            const messages = {
                "auth/email-already-in-use":
                    "This email already has an account. Please log in.",
                "auth/invalid-email":
                    "Please enter a valid email address.",
                "auth/weak-password":
                    "Please choose a stronger password.",
                "auth/network-request-failed":
                    "Network error. Check your internet connection."
            };

            createMessage.textContent =
                messages[error.code] ||
                "Account creation failed. Please try again.";
        }
    });
}
