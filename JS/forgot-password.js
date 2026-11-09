import { auth } from "./firebase-config.js";
import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const forgotForm = document.getElementById("forgotForm");
const forgotMessage = document.getElementById("forgotMessage");

if (forgotForm) {
    forgotForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const enteredUser =
            document.getElementById("forgotUser").value.trim();

        if (!enteredUser) {
            forgotMessage.textContent =
                "Please enter your username or email.";
            return;
        }

        forgotMessage.textContent = "Please wait...";

        try {
            let email = enteredUser;

            // If username is entered, get its email from Flask
            if (!enteredUser.includes("@")) {
                const response = await fetch(
                    "https://mindmirror-backend-b6zj.onrender.com/api/auth/username-email",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            username: enteredUser.toLowerCase()
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok || data.status !== "success") {
                    forgotMessage.textContent =
                        "Account not found. Please check your username or email.";
                    return;
                }

                email = data.email;
            }

            await sendPasswordResetEmail(auth, email);

            forgotMessage.textContent =
                "Password reset email sent! Please check your inbox.";

        } catch (error) {
            console.error("Password reset error:", error);

            if (error.code === "auth/invalid-email") {
                forgotMessage.textContent =
                    "Please enter a valid email address.";
            } else if (error.code === "auth/user-not-found") {
                forgotMessage.textContent =
                    "No account found with that email.";
            } else {
                forgotMessage.textContent =
                    "Unable to send reset email. Please try again.";
            }
        }
    });
}