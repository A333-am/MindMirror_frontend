
import { auth } from "./firebase-config.js";

const API_BASE = "https://mindmirror-backend-b6zj.onrender.com/api";

/* =========================================
   MINDMIRROR - WELLNESS PROGRESS
========================================= */

const progressData = {
    checkins: 0,
    mindfulness: 0,
    moodBoosters: 0,
    journalEntries: 0,
    routines: 0,
    sleepRecords: 0,
    averageSleepHours: 0,

    // VR Progress
    vrSessions: 0,
    vrSessionsCompleted: 0,
    vrActivityHistory: []
};

const moodScores = {
    Happy: 5,
    Excited: 5,
    Loved: 5,
    Confident: 5,
    Calm: 4,
    Relaxed: 4,
    Content: 4,
    Grateful: 4,
    Neutral: 3,
    Confused: 2,
    Worried: 2,
    Angry: 2,
    Frustrated: 2,
    Anxious: 2,
    Tired: 2,
    Stressed: 2,
    Sad: 1,
    Disappointed: 1,
    Lonely: 1,
    Scared: 1
};

const moodEmojis = {
    Happy: "😊",
    Excited: "🤩",
    Loved: "🥰",
    Confident: "😎",
    Calm: "😌",
    Relaxed: "☺️",
    Content: "🙂",
    Grateful: "🙏",
    Neutral: "😐",
    Confused: "😕",
    Worried: "😟",
    Angry: "😠",
    Frustrated: "😤",
    Anxious: "😰",
    Tired: "😴",
    Stressed: "😫",
    Sad: "😔",
    Disappointed: "😞",
    Lonely: "🥺",
    Scared: "😨"
};

let latestJournalData = null;
let moodData = [];
let activityChart = null;
async function loadJournalData(user) {
    try {
        const token = await user.getIdToken();

        const response = await fetch(
            `${API_BASE}/journal/${encodeURIComponent(user.uid)}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load journal data");
        }

        const data = await response.json();

        const entries = data.entries || [];

        latestJournalData = entries.length > 0 ? entries[0] : null;

    } catch (error) {
        console.error("Error loading journal data:", error);
    }
}


async function loadCheckinData(user) {
    try {
        const token = await user.getIdToken();

        const response = await fetch(
            `${API_BASE}/checkin/${encodeURIComponent(user.uid)}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load check-in data");
        }

        const data = await response.json();

        moodData = data.checkins || [];

        moodData.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

    } catch (error) {
        console.error("Error loading check-in data:", error);
    }
}

async function loadProgressData(user) {
    try {
        const token = await user.getIdToken();

        const response = await fetch(
            `${API_BASE}/progress/${encodeURIComponent(user.uid)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load progress data");
        }

        const data = await response.json();

        progressData.checkins = data.checkins || 0;
        progressData.mindfulness = data.mindful_exercises || 0;
        progressData.moodBoosters = data.mood_booster_activities || 0;
        progressData.journalEntries = data.journal_entries || 0;
        progressData.routines = data.routines || 0;
        progressData.sleepRecords = data.sleep_records || 0;
        progressData.averageSleepHours = data.average_sleep_hours || 0;

        // VR Session Progress
progressData.vrSessions = data.vr_sessions || 0;

progressData.vrSessionsCompleted =
    data.vr_sessions_completed || 0;

progressData.vrActivityHistory =
    data.vr_activity_history || [];

        progressData.mindfulnessCompleted =
    data.mindfulness_completed_count || 0;

progressData.mindfulnessDuration =
    data.mindfulness_total_duration || 0;

progressData.moodBoosterCompleted =
    data.mood_booster_completed_count || 0;

progressData.routineCompletionPercentage =
    data.routine_completion_percentage || 0;

    } catch (error) {
        console.error("Error loading progress:", error);
    }
}
/* =========================================
   PAGE INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    auth.onAuthStateChanged(async function (user) {

        if (!user) {
            console.log("Please log in to view your progress.");
            return;
        }

        await loadProgressData(user);
        await loadJournalData(user);
        await loadCheckinData(user);


        if (moodData.length > 0) {
            hidePreviewNotice();
      }

        await loadSleepData(user);
        await loadSocialSupportData(user);
        renderOverallProgress();
        renderMoodSummary(moodData);
        renderActivityChart();
        renderActivityDetails();
        renderSleepRoutine();
        renderReflection();
        renderLatestCheckin(moodData);
    });
});

/* =========================================
   LOAD SLEEP DATA FROM FLASK
========================================= */

async function loadSleepData(user) {

    try {

        const token = await user.getIdToken();

        const response = await fetch(
            `${API_BASE}/sleep/${encodeURIComponent(user.uid)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || data.status === "error") {
            throw new Error(
                data.message || "Unable to load sleep records."
            );
        }

        const records = Array.isArray(data.records)
            ? data.records
            : [];

        const validRecords = records.filter(function (record) {

            const hours = Number(record.sleep_hours);

            return (
                Number.isFinite(hours) &&
                hours >= 0 &&
                hours <= 24
            );

        });

        progressData.sleepRecords = validRecords.length;

        if (validRecords.length > 0) {

            const totalHours = validRecords.reduce(
                function (total, record) {
                    return total + Number(record.sleep_hours);
                },
                0
            );

            progressData.averageSleepHours = (
                totalHours / validRecords.length
            ).toFixed(1);

        } else {

            progressData.averageSleepHours = 0;

        }

    } catch (error) {

        console.error("Unable to load sleep data:", error);

        progressData.sleepRecords = 0;
        progressData.averageSleepHours = 0;

    }
}

/* =========================================
   LOAD SOCIAL SUPPORT DATA
========================================= */

async function loadSocialSupportData(user) {

    try {

        const token = await user.getIdToken();

        const response = await fetch(
            `${API_BASE}/social-support/${encodeURIComponent(user.uid)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || data.status === "error") {
            throw new Error(
                data.message || "Unable to load social support data."
            );
        }

        const records = Array.isArray(data.history)
            ? data.history
            : [];

        const total = records.length;

        const contacted = records.filter(function (record) {
            return record.contacted === true;
        }).length;

        const needed = records.filter(function (record) {
            return record.contacted === false;
        }).length;

        setText("supportTotal", total);
        setText("supportContacted", contacted);
        setText("supportNeeded", needed);

    } catch (error) {

        console.error("Unable to load social support data:", error);

    }
}

/* =========================================
   GET CHECK-INS FROM LOCAL STORAGE
========================================= */

function getLocalStorageMoodData() {

    try {

        const stored = localStorage.getItem("mindMirrorCheckins");

        if (!stored) {
            return [];
        }

        const checkins = JSON.parse(stored);

        if (!Array.isArray(checkins)) {
            return [];
        }

        return checkins.map(function (item) {

            const mood = item.mood || "Neutral";
            const score = moodScores[mood] || 3;

            const rawDate =
                item.date ||
                item.createdAt ||
                item.timestamp;

            const date = rawDate
                ? new Date(rawDate)
                : new Date();

            return {
                dateObject: date,
                date: formatShortDate(date),
                mood: mood,
                score: score
            };

        }).sort(function (a, b) {
            return a.dateObject - b.dateObject;
        });

    } catch (error) {

        console.warn("Could not read check-ins.", error);
        return [];

    }
}

/* =========================================
   GET ROUTINE DATA
========================================= */

function getRoutineData() {

    try {

        const stored = localStorage.getItem(
            "mindMirrorDailyRoutine"
        );

        if (!stored) {
            return {
                total: 0,
                completed: 0,
                percentage: 0
            };
        }

        const tasks = JSON.parse(stored);

        if (!Array.isArray(tasks)) {
            return {
                total: 0,
                completed: 0,
                percentage: 0
            };
        }

        const total = tasks.length;

        const completed = tasks.filter(function (task) {
            return task.completed === true;
        }).length;

        const percentage = total > 0
            ? Math.round((completed / total) * 100)
            : 0;

        return {
            total: total,
            completed: completed,
            percentage: percentage
        };

    } catch (error) {

        console.error("Unable to load routine data:", error);

        return {
            total: 0,
            completed: 0,
            percentage: 0
        };

    }
}

/* =========================================
   OVERALL PROGRESS
========================================= */

function renderOverallProgress() {

    const checkins = progressData.checkins;
    const mindfulness = progressData.mindfulness;
    const moodBoosters = progressData.moodBoosters;
    const journals = progressData.journalEntries;

    const checkinScore = Math.min(checkins / 7, 1);
    const mindfulnessScore = Math.min(mindfulness / 14, 1);
    const boosterScore = Math.min(moodBoosters / 7, 1);
    const journalScore = Math.min(journals / 7, 1);

    const overall = Math.round(
        (
            checkinScore +
            mindfulnessScore +
            boosterScore +
            journalScore
        ) / 4 * 100
    );

    setText("overallPercentage", `${overall}%`);

    const progressFill = document.getElementById(
        "overallProgressFill"
    );

    if (progressFill) {
        progressFill.style.width = `${overall}%`;
    }

    setText("totalCheckins", checkins);
    setText("mindfulnessCount", mindfulness);
    setText("moodBoosterCount", moodBoosters);
    setText("journalCount", journals);
}

/* =========================================
   MOOD SUMMARY
========================================= */
function renderMoodSummary(moodData) {

    if (!moodData || moodData.length === 0) {
        setText("latestMood", "No mood data yet");
        setText("averageMood", "0/5");
        return;
    }

    const scores = moodData.map(item =>
        moodScores[item.mood] || 3
    );

    const latest = moodData[0];

    const average = calculateAverage(scores);

    setText("latestMood", latest.mood);
    setText("averageMood", `${average}/5`);

    updateMoodTrend(moodData);
}

/* =========================================
   MOOD TREND
========================================= */
function updateMoodTrend(moodData) {

    const trendElement = document.getElementById("moodTrend");

    if (!trendElement || !moodData || moodData.length < 2) {

        if (trendElement) {
            trendElement.textContent = "Not enough data";
        }

        return;
    }

    const latest = moodScores[moodData[0].mood] || 3;
    const previous = moodScores[moodData[1].mood] || 3;

    if (latest > previous) {
        trendElement.textContent = "Improving";
    } else if (latest < previous) {
        trendElement.textContent = "Declining";
    } else {
        trendElement.textContent = "Stable";
    }
}


/* =========================================
   ACTIVITY BAR GRAPH
========================================= */

function renderActivityChart() {

    const canvas = document.getElementById("activityChart");

    if (!canvas) {
        return;
    }

    if (activityChart) {
        activityChart.destroy();
    }

    const ctx = canvas.getContext("2d");


    activityChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: [
                "Check-ins",
                "Mindfulness",
                "Mood Boosters",
                "Journals",
                "Routines",
                "Sleep",
                "VR Sessions"
            ],

            datasets: [{

                label: "Completed",

                data: [
    progressData.checkins,
    progressData.mindfulness,
    progressData.moodBoosters,
    progressData.journalEntries,
    progressData.routines,
    progressData.sleepRecords,
    progressData.vrSessionsCompleted
],

                backgroundColor: "#7357A8",
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 32

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    backgroundColor: "#4B3F72",
                    padding: 10,

                    titleFont: {
                        family: "Poppins",
                        size: 12
                    },

                    bodyFont: {
                        family: "Poppins",
                        size: 11
                    }

                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        precision: 0,

                        font: {
                            family: "Poppins",
                            size: 10
                        },

                        color: "#77727F"

                    },

                    grid: {
                        color: "#EEE9F4"
                    }

                },

                x: {

                    ticks: {

                        font: {
                            family: "Poppins",
                            size: 10
                        },

                        color: "#77727F"

                    },

                    grid: {
                        display: false
                    }

                }

            }

        }

    });
}

/* =========================================
   ACTIVITY DETAILS
========================================= */

function renderActivityDetails() {

    setText("checkinActivityValue", progressData.checkins);
    setText("mindfulnessActivityValue", progressData.mindfulness);
    setText("moodBoosterActivityValue", progressData.moodBoosters);
    setText("journalActivityValue", progressData.journalEntries);

    // VR Activity
    setText(
        "vrActivityValue",
        progressData.vrSessionsCompleted
    );

    renderVRActivityHistory();
}

/* =========================================
   VR ACTIVITY HISTORY
========================================= */

function renderVRActivityHistory() {

    const container = document.getElementById("vrActivityHistory");

    if (!container) return;

    const sessions = progressData.vrActivityHistory || [];

    container.innerHTML = "";

    if (sessions.length === 0) {
        container.textContent = "No VR sessions completed yet.";
        return;
    }

    sessions.forEach(function (session, index) {

        const item = document.createElement("div");
        item.className = "vr-session-card";

        item.innerHTML = `
            <div class="vr-session-icon">◉</div>

            <div class="vr-session-info">
                <h4>${session.environment || "VR Environment"}</h4>
                <p>Session ${index + 1}</p>
            </div>

            <span class="vr-session-status">✓ Completed</span>
        `;

        container.appendChild(item);

    });
}


/* =========================================
   SLEEP & ROUTINE PROGRESS
========================================= */
function renderSleepRoutine() {

    setText(
        "averageSleep",
        `${progressData.averageSleepHours} hrs`
    );

    setText(
        "routinePercentage",
        `${progressData.routineCompletionPercentage}%`
    );

}

/* =========================================
   JOURNAL REFLECTION
========================================= */
function renderReflection() {

    if (!latestJournalData) {
        setText("reflectionTitle", "No journal entry yet");
        setText("reflectionText", "Your journal reflections will appear here.");
        setText("reflectionDate", "");
        return;
    }

    setText(
        "reflectionTitle",
        latestJournalData.title || "Latest journal reflection"
    );

    setText(
        "reflectionText",
        latestJournalData.entry || ""
    );

    const date = latestJournalData.timestamp
        ? new Date(latestJournalData.timestamp).toLocaleDateString()
        : "";

    setText("reflectionDate", date);
}

/* =========================================
   GET JOURNAL DATA
========================================= */

function getJournalData() {

    const possibleKeys = [
        "mindMirrorJournalEntries",
        "journalEntries",
        "journals",
        "journalData"
    ];

    for (const key of possibleKeys) {

        try {

            const stored = localStorage.getItem(key);

            if (!stored) {
                continue;
            }

            const data = JSON.parse(stored);

            if (Array.isArray(data) && data.length > 0) {

                const latest = data[data.length - 1];

                const text =
                    latest.text ||
                    latest.content ||
                    latest.entry ||
                    latest.note ||
                    "";

                if (text) {
                    return {
                        text: text,
                        date: formatDateFromItem(latest)
                    };
                }

            }

            if (
                data &&
                typeof data === "object" &&
                !Array.isArray(data)
            ) {

                const text =
                    data.text ||
                    data.content ||
                    data.entry ||
                    data.note ||
                    "";

                if (text) {
                    return {
                        text: text,
                        date: formatDateFromItem(data)
                    };
                }

            }

        } catch (error) {

            console.warn(`Could not read ${key}`, error);

        }

    }

    return null;
}

/* =========================================
   LATEST CHECK-IN
========================================= */
function renderLatestCheckin(moodData) {

    if (!moodData || moodData.length === 0) {
        setText("latestMoodEmoji", "🙂");
        setText("latestMoodName", "No check-in yet");
        setText("latestCheckinDate", "Your latest mood will appear here.");
        return;
    }

    const latest = moodData[0];

    const emoji = moodEmojis[latest.mood] || "🙂";

    setText("latestMoodEmoji", emoji);
    setText("latestMoodName", latest.mood);

    const date = latest.timestamp
        ? new Date(latest.timestamp).toLocaleDateString()
        : "";

    setText(
        "latestCheckinDate",
        `${date} · Intensity ${latest.intensity}/10`
    );
}

/* =========================================
   HIDE PREVIEW MESSAGE
========================================= */

function hidePreviewNotice() {

    const notice = document.getElementById("previewNotice");

    if (notice) {
        notice.style.display = "none";
    }

}

/* =========================================
   HELPER - SET TEXT
========================================= */

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}

/* =========================================
   HELPER - AVERAGE
========================================= */

function calculateAverage(values) {

    if (!values || values.length === 0) {
        return "0.0";
    }

    const total = values.reduce(function (sum, value) {
        return sum + Number(value);
    }, 0);

    return (total / values.length).toFixed(1);

}

/* =========================================
   HELPER - SHORT DATE
========================================= */

function formatShortDate(date) {

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short"
    });

}

/* =========================================
   HELPER - JOURNAL DATE
========================================= */

function formatDateFromItem(item) {

    const rawDate =
        item.date ||
        item.createdAt ||
        item.timestamp ||
        item.created_at;

    if (!rawDate) {
        return "Recent reflection";
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
        return "Recent reflection";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

/* =========================================
   NAVIGATION
========================================= */
window.goToDashboard = function () {
    window.location.href = "./dashboard.html";
};

window.goToMood = function () {
    window.location.href = "./mood.html";
};
