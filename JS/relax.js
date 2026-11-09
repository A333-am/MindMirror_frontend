/* ==========================================================
   MINDMIRROR - RELAX & BREATHE
========================================================== */


/* ==========================================================
   ELEMENTS
========================================================== */

const startButton =
    document.getElementById("startBreathing");

const stopButton =
    document.getElementById("stopBreathing");

const breathingText =
    document.getElementById("breathingText");

const breathingMessage =
    document.getElementById("breathingMessage");

const timerDisplay =
    document.getElementById("timer");

const phaseLabel =
    document.getElementById("phaseLabel");

const cycleText =
    document.getElementById("cycleText");

const breathingCircle =
    document.getElementById("breathingCircle");

const venAvatar =
    document.getElementById("venAvatar");

const breathingTypeButtons =
    document.querySelectorAll(
        ".breathing-type-btn"
    );


/* ==========================================================
   VARIABLES
========================================================== */

let running = false;

let currentPhase = 0;

let currentCycle = 0;

let selectedBreathingType = "box";

let currentBreathingExercise = null;

let timerInterval = null;

let phaseTimeout = null;

let selectedVoice = null;


/* ==========================================================
   BREATHING DATA
========================================================== */

const breathingExercises = {

    box: {

        exercise_name: "Box Breathing",

        cycle: [

            {
                duration: 4,
                phase: "Inhale"
            },

            {
                duration: 4,
                phase: "Hold"
            },

            {
                duration: 4,
                phase: "Exhale"
            },

            {
                duration: 4,
                phase: "Hold"
            }

        ],

        cycles: 3,

        total_duration: 48
    },


    slow: {

        exercise_name: "Slow Breathing",

        cycle: [

            {
                duration: 4,
                phase: "Inhale"
            },

            {
                duration: 2,
                phase: "Hold"
            },

            {
                duration: 6,
                phase: "Exhale"
            }

        ],

        cycles: 3,

        total_duration: 36
    },


    deep: {

        exercise_name: "Deep Breathing",

        cycle: [

            {
                duration: 6,
                phase: "Deep Inhale"
            },

            {
                duration: 2,
                phase: "Hold"
            },

            {
                duration: 8,
                phase: "Slow Exhale"
            }

        ],

        cycles: 3,

        total_duration: 48
    }

};


/* ==========================================================
   DEFAULT EXERCISE
========================================================== */

currentBreathingExercise =
    breathingExercises.box;


/* ==========================================================
   VOICE INITIALIZATION
========================================================== */

function loadVoices() {

    if (!("speechSynthesis" in window)) {
        return;
    }

    const voices =
        window.speechSynthesis.getVoices();

    if (!voices.length) {
        return;
    }


    selectedVoice =
        voices.find(
            voice =>
                voice.lang === "en-US"
        );


    if (!selectedVoice) {

        selectedVoice =
            voices.find(
                voice =>
                    voice.lang.startsWith("en")
            );

    }


    if (!selectedVoice) {

        selectedVoice =
            voices[0];

    }

}


if ("speechSynthesis" in window) {

    loadVoices();

    window.speechSynthesis.onvoiceschanged =
        loadVoices;

}


/* ==========================================================
   SPEAK
========================================================== */

function speak(text) {

    if (
        !("speechSynthesis" in window) ||
        !text
    ) {
        return;
    }


    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(text);


    speech.lang = "en-US";

    speech.rate = 0.78;

    speech.pitch = 1.0;

    speech.volume = 1;


    if (selectedVoice) {

        speech.voice =
            selectedVoice;

    }


    window.speechSynthesis.speak(
        speech
    );

}


/* ==========================================================
   PHASE MESSAGE
========================================================== */

function getPhaseMessage(phase) {

    switch (phase) {

        case "Inhale":

            return "Breathe in slowly.";

        case "Hold":

            return "Hold gently.";

        case "Exhale":

            return "Breathe out slowly.";

        case "Deep Inhale":

            return "Take a deep breath in.";

        case "Slow Exhale":

            return "Slowly breathe out.";

        default:

            return "Breathe gently.";

    }

}


/* ==========================================================
   SHORT VOICE MESSAGE
========================================================== */

function getVoiceMessage(phase) {

    switch (phase) {

        case "Inhale":

            return "Inhale.";

        case "Hold":

            return "Hold.";

        case "Exhale":

            return "Exhale.";

        case "Deep Inhale":

            return "Deep inhale.";

        case "Slow Exhale":

            return "Slow exhale.";

        default:

            return phase + ".";

    }

}


/* ==========================================================
   EXERCISE SELECTION
========================================================== */

breathingTypeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                /* Do not change exercise
                   while running */

                if (running) {
                    return;
                }


                selectedBreathingType =
                    this.dataset.exercise;


                currentBreathingExercise =
                    breathingExercises[
                        selectedBreathingType
                    ];


                if (!currentBreathingExercise) {

                    console.error(
                        "Exercise not found:",
                        selectedBreathingType
                    );

                    return;
                }


                /* Active button */

                breathingTypeButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                /* Reset */

                currentPhase = 0;

                currentCycle = 0;


                /* Update screen */

                breathingText.textContent =
                    currentBreathingExercise.exercise_name;


                breathingMessage.textContent =
                    "Press Start Exercise when you're ready.";


                timerDisplay.textContent =
                    "—";


                phaseLabel.textContent =
                    "Ready";


                cycleText.textContent =
                    "Cycle 0 of " +
                    currentBreathingExercise.cycles;


                resetBreathingAnimation();

            }
        );

    }
);

/* ==========================================================
   START EXERCISE
========================================================== */

startButton.addEventListener(
    "click",
    async function () {

        if (running) {
            return;
        }

        startButton.disabled = true;

        try {

            await loadBreathingExercise();

            running = true;

            currentPhase = 0;
            currentCycle = 1;

            stopButton.disabled = false;

            breathingTypeButtons.forEach(
                button => {
                    button.disabled = true;
                }
            );

            cycleText.textContent =
                "Cycle 1 of " +
                currentBreathingExercise.cycles;

            runBreathingPhase();

        } catch (error) {

            console.error(
                "Error loading breathing exercise:",
                error
            );

            breathingMessage.textContent =
                "Unable to load the exercise. Please try again.";

            startButton.disabled = false;
            stopButton.disabled = true;

        }

    }
);

/* ==========================================================
   RUN BREATHING PHASE
========================================================== */

function runBreathingPhase() {

    if (!running) {
        return;
    }


    clearInterval(timerInterval);

    clearTimeout(phaseTimeout);


    const phase =
        currentBreathingExercise.cycle[
            currentPhase
        ];


    if (!phase) {

        finishExercise();

        return;

    }


    /* ----------------------------------------------
       TEXT
    ---------------------------------------------- */

    phaseLabel.textContent =
        phase.phase;


    breathingMessage.textContent =
        getPhaseMessage(
            phase.phase
        );


    /* ----------------------------------------------
       VOICE
    ---------------------------------------------- */

    speak(
        getVoiceMessage(
            phase.phase
        )
    );


    /* ----------------------------------------------
       ANIMATION
    ---------------------------------------------- */

    updateBreathingAnimation(
        phase.phase
    );


    /* ----------------------------------------------
       TIMER
    ---------------------------------------------- */

    startPhaseTimer(
        phase.duration
    );


    /* ----------------------------------------------
       NEXT PHASE
    ---------------------------------------------- */

    phaseTimeout =
        setTimeout(
            function () {

                if (!running) {
                    return;
                }


                currentPhase++;


                /* End of cycle */

                if (
                    currentPhase >=
                    currentBreathingExercise.cycle.length
                ) {

                    currentPhase = 0;

                    currentCycle++;


                    /* All cycles complete */

                    if (
                        currentCycle >
                        currentBreathingExercise.cycles
                    ) {

                        finishExercise();

                        return;

                    }


                    /* Next cycle */

                    cycleText.textContent =
                        "Cycle " +
                        currentCycle +
                        " of " +
                        currentBreathingExercise.cycles;


                    runBreathingPhase();


                    return;

                }


                /* Next phase */

                runBreathingPhase();

            },
            phase.duration * 1000
        );

}


/* ==========================================================
   PHASE TIMER
========================================================== */

function startPhaseTimer(seconds) {

    clearInterval(timerInterval);


    let remaining =
        seconds;


    timerDisplay.textContent =
        remaining + "s";


    timerInterval =
        setInterval(
            function () {

                if (!running) {

                    clearInterval(
                        timerInterval
                    );

                    return;

                }


                remaining--;


                if (remaining <= 0) {

                    clearInterval(
                        timerInterval
                    );

                    timerDisplay.textContent =
                        "";

                    return;

                }


                timerDisplay.textContent =
                    remaining + "s";

            },
            1000
        );

}


/* ==========================================================
   BREATHING ANIMATION
========================================================== */

function updateBreathingAnimation(phase) {

    breathingCircle.classList.remove(
        "breathe-in",
        "breathe-out",
        "hold-breath"
    );


    /* Restart CSS animation */

    void breathingCircle.offsetWidth;


    const phaseText =
        phase.toLowerCase();


    if (
        phaseText.includes("inhale")
    ) {

        breathingCircle.classList.add(
            "breathe-in"
        );

    }


    else if (
        phaseText.includes("exhale")
    ) {

        breathingCircle.classList.add(
            "breathe-out"
        );

    }


    else if (
        phaseText.includes("hold")
    ) {

        breathingCircle.classList.add(
            "hold-breath"
        );

    }

}


/* ==========================================================
   RESET ANIMATION
========================================================== */

function resetBreathingAnimation() {

    breathingCircle.classList.remove(
        "breathe-in",
        "breathe-out",
        "hold-breath"
    );

}


/* ==========================================================
   FINISH EXERCISE
========================================================== */

function finishExercise() {

    running = false;

    saveBreathingSession(true);

    clearInterval(timerInterval);

    clearTimeout(phaseTimeout);


    timerInterval = null;

    phaseTimeout = null;


    if ("speechSynthesis" in window) {

        window.speechSynthesis.cancel();

    }


    resetBreathingAnimation();


    phaseLabel.textContent =
        "Complete";


    timerDisplay.textContent =
        "✓";


    breathingText.textContent =
        "Well Done! 💜";


    breathingMessage.textContent =
        "You completed " +
        currentBreathingExercise.exercise_name +
        " for " +
        currentBreathingExercise.cycles +
        " cycles.";


    cycleText.textContent =
        "Exercise Complete";


    startButton.disabled = false;

    stopButton.disabled = true;


    breathingTypeButtons.forEach(
        button => {

            button.disabled = false;

        }
    );


    speak(
        "Well done. Your breathing exercise is complete."
    );

}


/* ==========================================================
   STOP EXERCISE
========================================================== */

stopButton.addEventListener(
    "click",
    function () {

        running = false;
        saveBreathingSession(false);


        clearInterval(
            timerInterval
        );


        clearTimeout(
            phaseTimeout
        );


        timerInterval = null;

        phaseTimeout = null;


        if ("speechSynthesis" in window) {

            window.speechSynthesis.cancel();

        }


        currentPhase = 0;

        currentCycle = 0;


        resetBreathingAnimation();


        breathingText.textContent =
            currentBreathingExercise.exercise_name;


        breathingMessage.textContent =
            "Exercise stopped. You can start again whenever you're ready.";


        phaseLabel.textContent =
            "Ready";


        timerDisplay.textContent =
            "—";


        cycleText.textContent =
            "Cycle 0 of " +
            currentBreathingExercise.cycles;


        startButton.disabled = false;

        stopButton.disabled = true;


        breathingTypeButtons.forEach(
            button => {

                button.disabled = false;

            }
        );

    }
);

import { auth } from "./firebase-config.js";

const API_BASE = "https://mindmirror-backend-b6zj.onrender.com/api";

/* ---------- AUTHENTICATED API HELPER ---------- */

async function apiRequest(path, options = {}) {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please log in to use Guided Breathing.");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
        throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
}

/* ---------- LOAD BREATHING TIMER FROM BACKEND ---------- */

async function loadBreathingExercise() {

    const exerciseNames = {
        box: "Box Breathing",
        slow: "Slow Breathing",
        deep: "Deep Breathing"
    };

    const exerciseName =
        exerciseNames[selectedBreathingType];

    const result = await apiRequest(
        `/mindfulness/breathing/timer?cycles=3&exercise_name=${encodeURIComponent(exerciseName)}`
    );

    currentBreathingExercise = {
        exercise_name: result.exercise_name,

        cycle: result.phases.map(phase => ({
            phase: phase.name,
            duration: phase.duration
        })),

        cycles: result.cycles,

        total_duration: result.total_duration
    };

}

/* ---------- SAVE COMPLETED BREATHING SESSION ---------- */

async function saveBreathingSession(completed) {
    try {
        const result = await apiRequest("/mindfulness/breathing/session", {
            method: "POST",
            body: JSON.stringify({
                exercise_name: currentBreathingExercise.exercise_name,
                cycles: completed
                    ? currentBreathingExercise.cycles
                    : Math.max(1, currentCycle - 1),
                completed: completed
            })
        });

        console.log("Breathing session saved:", result);
        return result;

    } catch (error) {
        console.error("Failed to save breathing session:", error);
        return null;
    }
}