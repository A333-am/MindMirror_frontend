// ==========================================
// MindMirror AI - Reset Password
// ==========================================

const resetButton =
    document.getElementById("resetPasswordBtn");

const newPassword =
    document.getElementById("newPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const resetMessage =
    document.getElementById("resetMessage");


if (resetButton) {

    resetButton.addEventListener("click", function () {

        const password =
            newPassword.value.trim();

        const confirm =
            confirmPassword.value.trim();


        if (password === "" || confirm === "") {

            resetMessage.textContent =
                "⚠️ Please enter both password fields.";

            return;
        }


        if (password.length < 6) {

            resetMessage.textContent =
                "⚠️ Password must contain at least 6 characters.";

            return;
        }


        if (password !== confirm) {

            resetMessage.textContent =
                "⚠️ Passwords do not match.";

            return;
        }


        // ==================================
        // UPDATE ACCOUNT PASSWORD
        // ==================================

        const savedUser =
            localStorage.getItem("mindMirrorUser");


        if (savedUser) {

            const user =
                JSON.parse(savedUser);

            user.password = password;

            localStorage.setItem(
                "mindMirrorUser",
                JSON.stringify(user)
            );

        }


        // IMPORTANT:
        // Login checks this exact key

        localStorage.setItem(
            "mindMirrorPassword",
            password
        );


        resetMessage.textContent =
            "✅ Password updated successfully!";


        setTimeout(function () {

            window.location.href =
                "index.html";

        }, 1500);

    });

}