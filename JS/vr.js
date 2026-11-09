
/* =========================================================
   MindMirror - VR Relaxation
   ========================================================= */

import { auth } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const environmentCards = document.querySelectorAll(".environment-card");
    const selectButtons = document.querySelectorAll(".select-environment");

    const nextButton = document.getElementById("vrNextButton");
    const nextButton2 = document.getElementById("vrNextButton2");

    const backButton = document.getElementById("vrBackButton");
    const backButton2 = document.getElementById("vrBackButton2");
    const backButton3 = document.getElementById("vrBackButton3");

    const startVRButton = document.getElementById("startVRSession");
    const completeVRButton = document.getElementById("completeVRSession");

    const selectedMessage = document.getElementById("selectedEnvironmentMessage");

    const selectedEnvironmentIcon = document.getElementById("selectedEnvironmentIcon");
    const selectedEnvironmentTitle = document.getElementById("selectedEnvironmentTitle");
    const selectedEnvironmentDescription = document.getElementById("selectedEnvironmentDescription");
    const selectedAPKDownload = document.getElementById("selectedAPKDownload");

    const vrStartIcon = document.getElementById("vrStartIcon");
    const vrStartEnvironment = document.getElementById("vrStartEnvironment");
    const vrStartMessage = document.getElementById("vrStartMessage");

    const vrTimerIcon = document.getElementById("vrTimerIcon");
    const vrTimerEnvironment = document.getElementById("vrTimerEnvironment");
    const vrTimer = document.getElementById("vrTimer");
    const vrSessionMessage = document.getElementById("vrSessionMessage");

    const vrCompletionEnvironment = document.getElementById("vrCompletionEnvironment");

    const viewAnotherEnvironment = document.getElementById("viewAnotherEnvironment");
    const vrDashboardButton = document.getElementById("vrDashboardButton");


    /* =====================================================
       SELECTED ENVIRONMENT
    ===================================================== */

    let selectedEnvironment = "";
    let selectedAPK = "";
    let selectedIcon = "🥽";

    let sessionStartTime = null;
    let timerInterval = null;


    /* =====================================================
       VR SLIDE NAVIGATION
    ===================================================== */

    function showVRSlide(slideNumber) {

        document.querySelectorAll(".vr-slide").forEach(function (slide) {
            slide.hidden = true;
            slide.style.display = "none";
        });

        const selectedSlide = document.getElementById("vrSlide" + slideNumber);

        if (selectedSlide) {
            selectedSlide.hidden = false;
            selectedSlide.style.display = "block";
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    /* =====================================================
       RESET SESSION
    ===================================================== */

    function resetSession() {

        clearInterval(timerInterval);

        timerInterval = null;
        sessionStartTime = null;

        selectedEnvironment = "";
        selectedAPK = "";
        selectedIcon = "🥽";

        if (nextButton) {
            nextButton.disabled = true;
        }

        if (selectedMessage) {
            selectedMessage.textContent = "";
        }

        if (startVRButton) {
            startVRButton.disabled = false;
        }

        if (completeVRButton) {
            completeVRButton.disabled = false;
        }

        if (vrTimer) {
            vrTimer.textContent = "Ready to start your session";
        }

        if (vrSessionMessage) {
            vrSessionMessage.textContent = "";
        }
    }


    /* =====================================================
       SELECT ENVIRONMENT
    ===================================================== */

    selectButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const card = button.closest(".environment-card");

            if (!card) {
                return;
            }

            selectedEnvironment = card.dataset.environment;
            selectedAPK = card.dataset.apk;
            selectedIcon = card.dataset.icon || "🥽";

            environmentCards.forEach(function (item) {
                item.classList.remove("selected");
            });

            card.classList.add("selected");

            if (selectedMessage) {
                selectedMessage.textContent = "Selected: " + selectedEnvironment;
            }

            if (nextButton) {
                nextButton.disabled = false;
            }
        });
    });


    /* =====================================================
       SLIDE 1 → SLIDE 2
       DYNAMIC DOWNLOAD PAGE
    ===================================================== */

    if (nextButton) {

        nextButton.addEventListener("click", function () {

            if (!selectedEnvironment || !selectedAPK) {
                alert("Please select a VR environment first.");
                return;
            }

            if (selectedEnvironmentIcon) {
                selectedEnvironmentIcon.textContent = selectedIcon;
            }

            if (selectedEnvironmentTitle) {
                selectedEnvironmentTitle.textContent = selectedEnvironment;
            }

            if (selectedEnvironmentDescription) {
                selectedEnvironmentDescription.textContent =
                    "Download the " + selectedEnvironment +
                    " VR application to your Android phone.";
            }

            if (selectedAPKDownload) {

                selectedAPKDownload.href = selectedAPK;

                selectedAPKDownload.setAttribute("download", "");

                selectedAPKDownload.textContent =
                    "⬇ Download " + selectedEnvironment + " APK";
            }

            showVRSlide(2);
        });
    }


    /* =====================================================
       SLIDE 2 → SLIDE 3
    ===================================================== */

    if (nextButton2) {

        nextButton2.addEventListener("click", function () {

            if (!selectedEnvironment) {
                alert("Please select an environment first.");
                return;
            }

            if (vrStartIcon) {
                vrStartIcon.textContent = selectedIcon;
            }

            if (vrStartEnvironment) {
                vrStartEnvironment.textContent = selectedEnvironment;
            }

            if (vrStartMessage) {
                vrStartMessage.textContent =
                    "Download and open the " + selectedEnvironment +
                    " APK on your Android phone. Return here after completing your VR session.";
            }

            showVRSlide(3);
        });
    }


    /* =====================================================
       BACK BUTTONS
    ===================================================== */

    if (backButton) {
        backButton.addEventListener("click", function () {
            showVRSlide(1);
        });
    }

    if (backButton2) {
        backButton2.addEventListener("click", function () {
            showVRSlide(2);
        });
    }

    if (backButton3) {
        backButton3.addEventListener("click", function () {
            showVRSlide(3);
        });
    }


    /* =====================================================
       START VR SESSION
    ===================================================== */

    if (startVRButton) {

        startVRButton.addEventListener("click", function () {

            if (!selectedEnvironment) {
                alert("Please select a VR environment first.");
                return;
            }

            if (vrTimerIcon) {
                vrTimerIcon.textContent = selectedIcon;
            }

            if (vrTimerEnvironment) {
                vrTimerEnvironment.textContent = selectedEnvironment;
            }

            sessionStartTime = Date.now();

            if (vrTimer) {
                vrTimer.textContent = "VR session started";
            }

            if (vrSessionMessage) {
                vrSessionMessage.textContent =
                    "Enjoy your VR relaxation. Return here when finished.";
            }

            if (completeVRButton) {
                completeVRButton.disabled = false;
            }

            clearInterval(timerInterval);

            timerInterval = setInterval(function () {

                if (!sessionStartTime) {
                    return;
                }

                const elapsedSeconds = Math.floor(
                    (Date.now() - sessionStartTime) / 1000
                );

                if (vrTimer) {
                    vrTimer.textContent =
                        "Session time: " + elapsedSeconds + " seconds";
                }

            }, 1000);

            showVRSlide(4);
        });
    }


    /* =====================================================
       SAVE COMPLETED VR SESSION
    ===================================================== */

    if (completeVRButton) {

        completeVRButton.addEventListener("click", async function () {

            if (!selectedEnvironment) {
                alert("No VR environment selected.");
                return;
            }

            completeVRButton.disabled = true;

            try {

                const user = auth.currentUser;

                if (!user) {

                    if (vrSessionMessage) {
                        vrSessionMessage.textContent =
                            "Please log in to save your session.";
                    }

                    completeVRButton.disabled = false;
                    return;
                }

                const token = await user.getIdToken();

                const response = await fetch(
                    "https://mindmirror-backend-b6zj.onrender.com/api/vr-session",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            environment: selectedEnvironment
                        })
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to save VR session."
                    );
                }

                clearInterval(timerInterval);

                if (vrCompletionEnvironment) {
                    vrCompletionEnvironment.textContent =
                        "Environment: " + selectedEnvironment;
                }

                if (vrSessionMessage) {
                    vrSessionMessage.textContent =
                        "VR session saved successfully!";
                }

                showVRSlide(5);

            } catch (error) {

                console.error("VR session error:", error);

                if (vrSessionMessage) {
                    vrSessionMessage.textContent =
                        "Save failed: " + error.message;
                }

                completeVRButton.disabled = false;
            }

        });
    }


    /* =====================================================
       VIEW ANOTHER ENVIRONMENT
    ===================================================== */

    if (viewAnotherEnvironment) {

        viewAnotherEnvironment.addEventListener("click", function () {

            resetSession();

            environmentCards.forEach(function (card) {
                card.classList.remove("selected");
            });

            showVRSlide(1);
        });
    }


    /* =====================================================
       RETURN TO DASHBOARD
    ===================================================== */

    if (vrDashboardButton) {

        vrDashboardButton.addEventListener("click", function () {
            window.location.href = "dashboard.html";
        });
    }


    /* =====================================================
       CHECK APK PATHS
    ===================================================== */

    environmentCards.forEach(function (card) {

        if (!card.dataset.apk) {
            console.warn("Missing APK path:", card.dataset.environment);
        }

    });


    /* =====================================================
       INITIAL SLIDE
    ===================================================== */

    showVRSlide(1);

});
