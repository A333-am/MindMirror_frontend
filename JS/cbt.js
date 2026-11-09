/* =========================================================
   MINDMIRROR CBT SUPPORT
   ========================================================= */

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
/* =========================================================
   CBT QUESTIONS
   ========================================================= */

const questions = [

    {
        icon: "💭",
        title: "What is bothering you right now?",
        helper:
            "Tell us what is currently making you uncomfortable, worried, tired or stressed."
    },

    {
        icon: "🧠",
        title: "What thought is going through your mind about this situation?",
        helper:
            "Write the main thought that keeps coming back to your mind."
    },

    {
        icon: "💜",
        title: "How does this thought make you feel?",
        helper:
            "Describe the emotions or feelings you experience."
    },

    {
        icon: "🔍",
        title: "What makes you believe this thought is true?",
        helper:
            "Think about the experiences or evidence that support this thought."
    },

    {
        icon: "🌱",
        title: "Is there anything that might suggest a different way of looking at this situation?",
        helper:
            "Try to consider another possible explanation or perspective."
    },

    {
        icon: "🌿",
        title: "What is one small thing you can do right now to help yourself?",
        helper:
            "Choose one simple and realistic action that could help you feel a little better."
    }

];


/* =========================================================
   STATE
   ========================================================= */

let currentQuestion = 0;

let answers =
    Array(questions.length).fill("");

const totalQuestions =
    questions.length;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const questionCard =
    document.getElementById("questionCard");

const questionIcon =
    document.getElementById("questionIcon");

const questionTitle =
    document.getElementById("questionTitle");

const questionHelper =
    document.getElementById("questionHelper");

const answerInput =
    document.getElementById("answerInput");

const characterCount =
    document.getElementById("characterCount");

const progressText =
    document.getElementById("progressText");

const progressPercentage =
    document.getElementById("progressPercentage");

const progressFill =
    document.getElementById("progressFill");

const questionProgress =
    document.getElementById("questionProgress");

const questionNavigation =
    document.getElementById("questionNavigation");

const backBtn =
    document.getElementById("backBtn");

const nextBtn =
    document.getElementById("nextBtn");

const message =
    document.getElementById("message");

const analysisCard =
    document.getElementById("analysisCard");

const resultSection =
    document.getElementById("resultSection");

const userThought =
    document.getElementById("userThought");

const cbtResponse =
    document.getElementById("cbtResponse");

const activityIcon =
    document.getElementById("activityIcon");

const activityTitle =
    document.getElementById("activityTitle");

const activityDescription =
    document.getElementById("activityDescription");

const startActivityBtn =
    document.getElementById("startActivityBtn");

const restartBtn =
    document.getElementById("restartBtn");

const sessionRecordedText =
    document.getElementById("sessionRecordedText");

const historyList =
    document.getElementById("historyList");

const emptyHistory =
    document.getElementById("emptyHistory");


/* =========================================================
   CBT ANALYSIS PATTERNS
   ========================================================= */

const analysisPatterns = [

    {
        keywords: [
            "tired",
            "exhausted",
            "no energy",
            "fatigue"
        ],

        icon: "🧘",

        title: "Slow Breathing",

        description:
            "Try the slow-breathing exercise for a few minutes to pause and refocus.",

        response:
            "It sounds like you're carrying a lot of tiredness right now. When we feel exhausted, it can be easy to judge ourselves for not doing enough. Let's separate what was actually within your control from what wasn't.",

        activityType: "breathing"
    },


    {
        keywords: [
            "worried",
            "worry",
            "anxious",
            "anxiety",
            "nervous"
        ],

        icon: "🌬️",

        title: "Guided Breathing",

        description:
            "Take a few slow breaths and give your mind a moment to settle.",

        response:
            "It sounds like your mind is spending a lot of energy thinking about what might happen. Let's pause and focus on what you can control right now.",

        activityType: "breathing"
    },


    {
        keywords: [
            "sad",
            "lonely",
            "alone",
            "hopeless"
        ],

        icon: "🌱",

        title: "Small Positive Step",

        description:
            "Take one small, manageable step that can give you a moment of comfort.",

        response:
            "It sounds like you're going through a difficult emotional moment. You don't have to solve everything immediately. One small supportive action can be enough for now.",

        activityType: "breathing"
    },


    {
        keywords: [
            "stress",
            "stressed",
            "pressure",
            "overwhelmed"
        ],

        icon: "🌬️",

        title: "Thought Break",

        description:
            "Pause for a moment and use slow breathing to create some mental space.",

        response:
            "It sounds like you're carrying several things at once. When everything feels urgent, taking a short pause can help you step back and decide what needs attention first.",

        activityType: "breathing"
    },


    {
        keywords: [
            "angry",
            "anger",
            "frustrated",
            "frustration"
        ],

        icon: "🌿",

        title: "Pause & Breathe",

        description:
            "Take a few slow breaths before reacting to the situation.",

        response:
            "It sounds like this situation has created a strong emotional reaction. Giving yourself a short pause before responding can help you understand what you actually need.",

        activityType: "breathing"
    },


    {
        keywords: [
            "failure",
            "worthless",
            "useless",
            "not good enough",
            "i can't"
        ],

        icon: "🧠",

        title: "Thought Reframing",

        description:
            "Take a moment to challenge the negative thought and consider another perspective.",

        response:
            "It sounds like you're being very hard on yourself. One difficult experience does not define your ability or your worth. Try looking at the situation with the same kindness you would offer someone else.",

        activityType: "breathing"
    }

];


/* =========================================================
   DEFAULT ANALYSIS
   ========================================================= */

const defaultAnalysis = {

    icon: "🧘",

    title: "Mindful Pause",

    description:
        "Take a few slow breaths and give yourself a quiet moment to reset.",

    response:
        "Thank you for reflecting on your thoughts. Sometimes putting our thoughts into words can help us understand them more clearly. Try taking a short pause and focusing on one small step you can manage right now.",

    activityType: "breathing"

};


/* =========================================================
   LOAD QUESTION
   ========================================================= */

function loadQuestion() {

    const question =
        questions[currentQuestion];

    questionIcon.textContent =
        question.icon;

    questionTitle.textContent =
        question.title;

    questionHelper.textContent =
        question.helper;

    answerInput.value =
        answers[currentQuestion];

    characterCount.textContent =
        answerInput.value.length;

    updateProgress();

    clearMessage();

    backBtn.disabled =
        currentQuestion === 0;

    if (
        currentQuestion ===
        totalQuestions - 1
    ) {

        nextBtn.textContent =
            "Analyse My Answers →";

    } else {

        nextBtn.textContent =
            "Next →";
    }

}


/* =========================================================
   UPDATE PROGRESS
   ========================================================= */

function updateProgress() {

    const questionNumber =
        currentQuestion + 1;

    const percentage =
        Math.round(
            (questionNumber / totalQuestions) * 100
        );

    progressText.textContent =
        `Question ${questionNumber} of ${totalQuestions}`;

    progressPercentage.textContent =
        `${percentage}%`;

    progressFill.style.width =
        `${percentage}%`;
}


/* =========================================================
   CHARACTER COUNT
   ========================================================= */

answerInput.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            answerInput.value.length;

        clearMessage();

    }
);


/* =========================================================
   NEXT BUTTON
   ========================================================= */

nextBtn.addEventListener(
    "click",
    () => {

        const answer =
            answerInput.value.trim();

        if (!answer) {

            showMessage(
                "Please write an answer before continuing.",
                "error"
            );

            answerInput.focus();

            return;
        }

        answers[currentQuestion] =
            answer;


        if (
            currentQuestion <
            totalQuestions - 1
        ) {

            currentQuestion++;

            loadQuestion();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } else {

            analyseAnswers();

        }

    }
);


/* =========================================================
   BACK BUTTON
   ========================================================= */

backBtn.addEventListener(
    "click",
    () => {

        if (currentQuestion === 0) {
            return;
        }

        answers[currentQuestion] =
            answerInput.value.trim();

        currentQuestion--;

        loadQuestion();

    }
);


/* =========================================================
   ANALYSE ANSWERS
   ========================================================= */


async function analyseAnswers() {

    answers[currentQuestion] =
        answerInput.value.trim();

    questionCard.classList.add("hidden");
    questionProgress.classList.add("hidden");
    questionNavigation.classList.add("hidden");

    analysisCard.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    try {

        const user = auth.currentUser;

        if (!user) {
            throw new Error("Please log in to continue.");
        }

        const token = await user.getIdToken();

        const response = await fetch(
            "https://mindmirror-backend-b6zj.onrender.com/cbt-exercise",
            {
                method: "POST",

                signal: AbortSignal.timeout(60000),

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify({
                    step: 6,
                    answer: answers[5],
                    answers: {
                        "1": answers[0],
                        "2": answers[1],
                        "3": answers[2],
                        "4": answers[3],
                        "5": answers[4],
                        "6": answers[5]
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Unable to generate CBT response."
            );
        }

        showResult(data);

    } catch (error) {

        console.error("CBT Analysis Error:", error);

        analysisCard.classList.add("hidden");

        questionCard.classList.remove("hidden");
        questionProgress.classList.remove("hidden");
        questionNavigation.classList.remove("hidden");

        showMessage(
            error.message || "Unable to connect to CBT AI.",
            "error"
        );
    }
}



/* =========================================================
   GET CBT ANALYSIS
   ========================================================= */

function getCBTAnalysis() {

    const combinedAnswers =
        answers
            .join(" ")
            .toLowerCase();


    for (
        const pattern
        of analysisPatterns
    ) {

        const found =
            pattern.keywords.some(
                keyword =>
                    combinedAnswers.includes(
                        keyword
                    )
            );

        if (found) {
            return pattern;
        }

    }

    return defaultAnalysis;
}

/* =========================================================
   SHOW RESULT
   ========================================================= */

function showResult(analysis) {

    analysisCard.classList.add("hidden");
    resultSection.classList.remove("hidden");

    const mainThought =
        answers[1]?.trim() ||
        answers[0]?.trim() ||
        "Your reflection";

    userThought.textContent = mainThought;

    // Display AI-generated CBT response
    cbtResponse.textContent =
        analysis.cbt_response || "No CBT response available.";

    // Display suggested activity
    activityIcon.textContent = "🧘";

    activityTitle.textContent =
        analysis.suggested_activity || "Mindful Pause";

    activityDescription.textContent =
        analysis.activity_reason || "";

    // Your backend does not return activityType
    setupActivityButton("breathing");

    // Display session date and refresh history
    recordCBTSession();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   ACTIVITY BUTTON
   ========================================================= */

function setupActivityButton(
    activityType
) {

    const newButton =
        startActivityBtn.cloneNode(true);

    startActivityBtn.parentNode.replaceChild(
        newButton,
        startActivityBtn
    );


    if (
        activityType ===
        "breathing"
    ) {

        newButton.textContent =
            "Start Breathing Exercise";

        newButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "relax.html";

            }
        );

    } else {

        newButton.textContent =
            "Start Relaxation";

        newButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "relax.html";

            }
        );

    }

}


/* =========================================================
   RECORD CBT SESSION
   ========================================================= */


function recordCBTSession() {

    const now = new Date();

    const date = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    const time = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    sessionRecordedText.textContent =
        `Session recorded on ${date} at ${time}.`;

    renderCBTHistory();
}



/* =========================================================
   RENDER CBT HISTORY
   ========================================================= */


async function renderCBTHistory() {

    try {

        const user = auth.currentUser;

        if (!user) {
            historyList.innerHTML = "";
            emptyHistory.classList.remove("hidden");
            return;
        }

        const token = await user.getIdToken();

        const response = await fetch(
            "https://mindmirror-backend-b6zj.onrender.com/cbt-history",
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Unable to load CBT history.");
        }

        historyList.innerHTML = "";

        const history = data.history || [];

        if (history.length === 0) {
            emptyHistory.classList.remove("hidden");
            return;
        }

        emptyHistory.classList.add("hidden");

        history.forEach(session => {

            const date = session.created_at
                ? new Date(session.created_at)
                : null;

            const historyItem = document.createElement("div");

            historyItem.className = "history-item";

            const sessionDate = date && !isNaN(date)
                ? date.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                })
                : "Date unavailable";

            const sessionTime = date && !isNaN(date)
                ? date.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                })
                : "";

            historyItem.innerHTML = `
                <div class="history-left">
                    <div class="history-icon">🧠</div>
                    <div>
                        <div class="history-title">CBT Session</div>
                        <div class="history-date">
                            ${escapeHTML(sessionDate)}
                        </div>
                    </div>
                </div>

                <div class="history-time">
                    ${escapeHTML(sessionTime)}
                </div>
            `;

            historyList.appendChild(historyItem);

        });

    } catch (error) {

        console.error("CBT History Error:", error);

    }
}



/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;
}


/* =========================================================
   RESTART CBT
   ========================================================= */

restartBtn.addEventListener(
    "click",
    () => {

        currentQuestion = 0;

        answers =
            Array(totalQuestions).fill("");

        resultSection.classList.add(
            "hidden"
        );

        questionCard.classList.remove(
            "hidden"
        );

        questionProgress.classList.remove(
            "hidden"
        );

        questionNavigation.classList.remove(
            "hidden"
        );

        loadQuestion();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* =========================================================
   MESSAGE FUNCTIONS
   ========================================================= */

function showMessage(
    text,
    type
) {

    message.textContent =
        text;

    message.className =
        `message ${type}`;

}


function clearMessage() {

    message.textContent =
        "";

    message.className =
        "message";

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function goToDashboard() {
    window.location.href = "dashboard.html";
}

window.goToDashboard = goToDashboard;


/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadQuestion();

onAuthStateChanged(auth, user => {

    if (user) {
        renderCBTHistory();
    }

});