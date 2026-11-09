/* =========================================
   MINDMIRROR - DAILY CHECK-IN
========================================= */

import { auth } from "../JS/firebase-config.js";
document.addEventListener("DOMContentLoaded", () => {

    const moodOptions = document.querySelectorAll(".mood-option");
    const intensitySlider = document.getElementById("moodIntensity");
    const intensityValue = document.getElementById("intensityValue");

    const moodNote = document.getElementById("moodNote");
    const characterCount = document.getElementById("characterCount");

    const saveButton = document.getElementById("saveCheckinBtn");

    const moodError = document.getElementById("moodError");
    const checkinMessage = document.getElementById("checkinMessage");

    let selectedMood = "";


    /* SELECT MOOD */

    moodOptions.forEach((option) => {

        option.addEventListener("click", () => {

            moodOptions.forEach((item) => {
                item.classList.remove("selected");
            });

            option.classList.add("selected");

selectedMood = option.dataset.mood;

console.log("Selected mood:", selectedMood);
console.log("Selected class:", option.className);

            moodError.classList.remove("show");
            moodError.textContent = "";

            clearMessage();

        });

    });


    /* MOOD INTENSITY */

    intensitySlider.addEventListener("input", () => {

        intensityValue.textContent = intensitySlider.value;

        clearMessage();

    });


    /* NOTE CHARACTER COUNT */

    moodNote.addEventListener("input", () => {

        characterCount.textContent = moodNote.value.length;

        clearMessage();

    });


    /* SAVE CHECK-IN */

    saveButton.addEventListener("click", saveCheckin);


    async function saveCheckin() {

        clearMessage();

        if (!selectedMood) {

            moodError.textContent =
                "Please select a mood before saving your check-in.";

            moodError.classList.add("show");

            showMessage(
                "Please choose how you are feeling today.",
                "error"
            );

            return;
        }


        /* CHECK FIREBASE LOGIN */

        const user = auth.currentUser;

        if (!user) {

            showMessage(
                "Please log in before saving your check-in.",
                "error"
            );

            return;
        }


        /* GET FIREBASE TOKEN */

        saveButton.disabled = true;

        const originalText = saveButton.textContent;

        saveButton.textContent = "Saving...";


        try {

            const token = await user.getIdToken();

            const checkin = {
                mood: selectedMood,
                intensity: Number(intensitySlider.value),
                note: moodNote.value.trim()
            };


            /* SEND DATA TO FLASK */

            const response = await fetch(
                "https://mindmirror-backend-b6zj.onrender.com/api/checkin",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify(checkin)
                }
            );


            const result = await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message || "Unable to save check-in."
                );

            }


            /* SUCCESS */

            showMessage(
                "Your daily check-in was saved successfully.",
                "success"
            );

            saveButton.textContent = "Saved ✓";


            setTimeout(() => {

                resetForm();

                saveButton.textContent = originalText;
                saveButton.disabled = false;

            }, 1800);


        } catch (error) {

            console.error("Check-in error:", error);

            showMessage(
                error.message || "Unable to save check-in. Please try again.",
                "error"
            );

            saveButton.textContent = originalText;
            saveButton.disabled = false;

        }

    }


    /* RESET FORM */

    function resetForm() {

        moodOptions.forEach((option) => {
            option.classList.remove("selected");
        });

        selectedMood = "";

        intensitySlider.value = 5;
        intensityValue.textContent = "5";

        moodNote.value = "";
        characterCount.textContent = "0";

    }


    /* SUCCESS / ERROR MESSAGE */

    function showMessage(message, type) {

        checkinMessage.textContent = message;

        checkinMessage.className =
            `checkin-message ${type}`;

    }


    function clearMessage() {

        checkinMessage.textContent = "";

        checkinMessage.className =
            "checkin-message";

    }

});


/* NAVIGATION */

window.goToDashboard = function () {
    window.location.href = "dashboard.html";
};

window.goToProgress = function () {
    window.location.href = "progress.html";
};