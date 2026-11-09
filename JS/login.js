
/* ==========================================
   MINDMIRROR AI - LOGIN
========================================== */

import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginMessage = document.getElementById("loginMessage");


    /* ==========================================
       PASSWORD SHOW / HIDE
    ========================================== */

    if (togglePassword) {

        togglePassword.addEventListener("click", function () {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";
                togglePassword.textContent = "🙈";

            } else {

                passwordInput.type = "password";
                togglePassword.textContent = "👁";

            }

        });

    }


    /* ==========================================
       LOGIN
    ========================================== */

    if (loginForm) {

        loginForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const username =
                usernameInput.value.trim().toLowerCase();

            const password =
                passwordInput.value;


            /* Check empty fields */

            if (username === "" || password === "") {

                loginMessage.textContent =
                    "⚠️ Please enter your username and password.";

                loginMessage.style.color = "#b04a4a";

                return;

            }


            loginMessage.textContent = "Please wait...";
            loginMessage.style.color = "#77727F";


            try {

                /* ==================================
                   STEP 1: FIND EMAIL USING USERNAME
                ================================== */

                const response = await fetch(
                    "https://mindmirror-backend-b6zj.onrender.com/api/auth/username-email",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            username: username
                        })
                    }
                );


                const data = await response.json();


                if (!response.ok || data.status !== "success") {

                    loginMessage.textContent =
                        "❌ Incorrect username or password.";

                    loginMessage.style.color = "#b04a4a";

                    return;

                }


                /* ==================================
                   STEP 2: SIGN IN WITH FIREBASE
                ================================== */

                const result = await signInWithEmailAndPassword(
                    auth,
                    data.email,
                    password
                );


                const firebaseUser = result.user;


                /* ==================================
                   STEP 3: SAVE LOGIN INFORMATION
                ================================== */

                localStorage.setItem(
                    "mindMirrorLoggedIn",
                    "true"
                );


                localStorage.setItem(
                    "mindMirrorProfile",
                    JSON.stringify({

                        name: firebaseUser.displayName || "",
                        email: firebaseUser.email,
                        username: username

                    })
                );


                /* ==================================
                   STEP 4: LOGIN SUCCESS
                ================================== */

                loginMessage.textContent =
                    "✅ Login successful!";

                loginMessage.style.color = "#5b8a62";


                /* Go to Dashboard */

                setTimeout(function () {

                    window.location.href = "dashboard.html";

                }, 800);


            } catch (error) {

                console.error("Login error:", error);


                /* Handle login errors */

                if (
                    error.code === "auth/invalid-credential" ||
                    error.code === "auth/wrong-password" ||
                    error.code === "auth/user-not-found"
                ) {

                    loginMessage.textContent =
                        "❌ Incorrect username or password.";

                } else if (
                    error.message === "Failed to fetch" ||
                    error instanceof TypeError
                ) {

                    loginMessage.textContent =
                        "⚠️ Cannot connect. Check that Flask is running and CORS is configured.";

                } else if (
                    error.code === "auth/too-many-requests"
                ) {

                    loginMessage.textContent =
                        "⚠️ Too many attempts. Please try again later.";

                } else {

                    loginMessage.textContent =
                        "⚠️ Login failed. Please try again.";

                }

                loginMessage.style.color = "#b04a4a";

            }

        });

    }

});
