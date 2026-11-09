/* =====================================================
   MINDMIRROR AI
   DASHBOARD JAVASCRIPT
===================================================== */


/* =====================================================
   RUN AFTER PAGE LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    updateTodayDate();

    loadDashboardMood();

    setDailyReminder();

});


/* =====================================================
   TODAY'S DATE
===================================================== */

function updateTodayDate() {

    const dateElement = document.getElementById("todayDate");

    if (!dateElement) {
        return;
    }

    const today = new Date();

    const options = {
        day: "numeric",
        month: "short",
        year: "numeric"
    };

    dateElement.textContent = today.toLocaleDateString(
        "en-IN",
        options
    );
}


/* =====================================================
   LOAD MOOD
===================================================== */

function loadDashboardMood() {

    const moodElement =
        document.getElementById("dashboardMood");

    const detailsElement =
        document.getElementById("dashboardMoodDetails");


    if (!moodElement) {
        return;
    }


    /*
     * Try the common localStorage keys that may
     * already be used by the existing mood page.
     */

    const possibleKeys = [

        "dailyCheckin",

        "mindMirrorDailyCheckin",

        "mindMirrorMood",

        "moodData",

        "latestMood",

        "lastMood",

        "savedMood"

    ];


    let savedMood = null;


    for (const key of possibleKeys) {

        const storedValue = localStorage.getItem(key);

        if (!storedValue) {
            continue;
        }


        try {

            const parsedValue =
                JSON.parse(storedValue);

            if (parsedValue) {

                savedMood = parsedValue;

                break;
            }

        } catch (error) {

            /*
             * If the stored value is just plain text,
             * use it directly.
             */

            savedMood = {
                mood: storedValue
            };

            break;
        }
    }


    /*
     * Nothing has been saved yet.
     */

    if (!savedMood) {

        moodElement.textContent =
            "Not checked in";

        if (detailsElement) {

            detailsElement.textContent =
                "How you're feeling today";
        }

        return;
    }


    /* =================================================
       HANDLE DIFFERENT POSSIBLE DATA FORMATS
    ================================================= */


    let mood = "";

    let intensity = null;

    let note = "";


    /*
     * Mood field
     */

    if (typeof savedMood === "string") {

        mood = savedMood;

    } else {

        mood =
            savedMood.mood ||
            savedMood.selectedMood ||
            savedMood.feeling ||
            savedMood.emotion ||
            "";
    }


    /*
     * Intensity field
     */

    if (typeof savedMood === "object") {

        intensity =
            savedMood.intensity ??
            savedMood.moodRange ??
            savedMood.range ??
            savedMood.score ??
            null;
    }


    /*
     * Note field
     */

    if (typeof savedMood === "object") {

        note =
            savedMood.note ||
            savedMood.description ||
            "";
    }


    /*
     * If mood is still empty, don't display raw JSON.
     */

    if (!mood) {

        moodElement.textContent =
            "Not checked in";

        if (detailsElement) {

            detailsElement.textContent =
                "How you're feeling today";
        }

        return;
    }


    /* =================================================
       DISPLAY MOOD
    ================================================= */

    moodElement.textContent = formatMood(mood);


    /* =================================================
       DISPLAY DETAILS
    ================================================= */

    let details = "";


    if (intensity !== null && intensity !== "") {

        details =
            "Intensity: " +
            intensity +
            "/5";

    } else {

        details =
            "How you're feeling today";
    }


    /*
     * If a note exists, show a small indication.
     * Do NOT show the whole note on the dashboard.
     */

    if (note) {

        details += " · Note added";
    }


    if (detailsElement) {

        detailsElement.textContent = details;
    }
}


/* =====================================================
   FORMAT MOOD
===================================================== */

function formatMood(mood) {

    if (!mood) {
        return "Not checked in";
    }


    /*
     * Convert values such as:
     * very_sad
     * very-sad
     * VERY SAD
     *
     * into:
     * Very Sad
     */

    return String(mood)

        .replace(/[_-]+/g, " ")

        .replace(/\s+/g, " ")

        .trim()

        .toLowerCase()

        .replace(/\b\w/g, function (letter) {

            return letter.toUpperCase();

        });
}


/* =====================================================
   DAILY REMINDERS
   One reminder is selected for each day.
   It changes automatically on the next day.
===================================================== */

function setDailyReminder() {

    const reminderElement =
        document.getElementById("dailyReminderText");


    if (!reminderElement) {
        return;
    }


    const reminders = [

        "You don't have to fix everything today. Just take the next small step.",

        "Be gentle with yourself today. Small progress still matters.",

        "Take a slow breath and give yourself a moment to pause.",

        "You are allowed to take things one step at a time.",

        "A difficult moment does not define your whole day.",

        "Make some space for yourself today. You deserve that pause.",

        "Progress does not have to be perfect to be meaningful.",

        "Check in with yourself before you rush into the next thing.",

        "Today is another opportunity to care for your mind.",

        "Rest is also a part of taking care of yourself.",

        "You don't need to have everything figured out right now.",

        "Give yourself the same kindness you would give someone you care about.",

        "One small positive action can be enough for today.",

        "Pause. Breathe. Notice how you are feeling.",

        "Your feelings are worth noticing, even on busy days."

    ];


    /*
     * Create a number based on today's date.
     *
     * This means:
     *
     * Same day = same reminder
     * Next day = potentially different reminder
     *
     * Refreshing the page will NOT randomly change it.
     */

    const today = new Date();

    const dateNumber =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();


    const reminderIndex =
        dateNumber % reminders.length;


    reminderElement.textContent =
        reminders[reminderIndex];
}


/* =====================================================
   OPTIONAL: REFRESH MOOD WHEN TAB BECOMES ACTIVE
===================================================== */

document.addEventListener(
    "visibilitychange",
    function () {

        if (!document.hidden) {

            loadDashboardMood();

            updateTodayDate();

            setDailyReminder();
        }

    }
);
/* =====================================================
   DAILY WELLNESS REMINDER
   Changes automatically each new day
===================================================== */

const dailyReminders = [

    "You don't have to fix everything today. Just take the next small step.",

    "Be patient with yourself. Progress can be quiet, but it still matters.",

    "Take a moment to notice how far you've come.",

    "Your feelings are valid, and you deserve a little kindness today.",

    "Rest is also a part of progress.",

    "Give yourself permission to slow down and breathe.",

    "A new day doesn't need a perfect beginning. Just begin gently.",

    "You are allowed to take things one moment at a time.",

    "Small steps are still steps forward.",

    "You don't need to have everything figured out today.",

    "Take a breath. You are doing better than you think.",

    "Be kind to the person you are becoming.",

    "Today is another opportunity to take care of yourself.",

    "Your pace is your own. There is no need to rush.",

    "It's okay to pause. You can continue when you're ready.",

    "Make space for something that brings you a little peace.",

    "You deserve the same kindness that you give to others.",

    "One calm moment can change the direction of your day.",

    "You don't need a perfect day to have a meaningful one.",

    "Today, choose progress over perfection.",

    "Listen to what your mind and body need today.",

    "You can start again at any moment.",

    "Give yourself permission to have a slower day.",

    "There is strength in asking for support when you need it.",

    "Focus on what you can do today, not everything at once.",

    "Your small efforts today can become meaningful changes tomorrow.",

    "Take care of yourself without feeling guilty about it.",

    "You are more than one difficult moment.",

    "Let today be gentle with you.",

    "Breathe. Reflect. Take the next small step."

];


/* =====================================================
   GET ONE REMINDER FOR THE CURRENT DAY
===================================================== */

function showDailyReminder() {

    const reminderElement = document.getElementById("dailyReminder");

    if (!reminderElement) {
        return;
    }

    const today = new Date();

    /*
       Create a number based on today's date.

       This means:
       - Same day = same reminder
       - New day = different reminder
       - Refreshing the page does NOT randomly change it
    */

    const startOfYear = new Date(today.getFullYear(), 0, 0);

    const difference =
        today - startOfYear;

    const oneDay =
        1000 * 60 * 60 * 24;

    const dayOfYear =
        Math.floor(difference / oneDay);

    const reminderIndex =
        dayOfYear % dailyReminders.length;

    reminderElement.textContent =
        dailyReminders[reminderIndex];
}


/* =====================================================
   START DAILY REMINDER
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    showDailyReminder();

});