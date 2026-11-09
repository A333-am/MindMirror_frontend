/* =========================================================
   MINDMIRROR - MOOD BOOSTER
   25 interactive activities
   No countdown timers
========================================================= */
/* =========================================================
   FIREBASE AND BACKEND CONNECTION
========================================================= */

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const API_URL = "https://mindmirror-backend-b6zj.onrender.com/api/mood-booster";

let currentUser = null;
let firebaseCompletedActivities = new Set();
/* =========================================================
   ACTIVITY DATA
========================================================= */

const activities = [

    {
        id: 1,
        icon: "🚶",
        title: "Go for a Walk",
        category: "Fitness",
        description: "Take a mindful walk and notice the world around you.",
        type: "walk"
    },

    {
        id: 2,
        icon: "🎵",
        title: "Listen to Music",
        category: "Music",
        description: "Choose a track that matches the mood you want to create.",
        type: "music"
    },

    {
        id: 3,
        icon: "🎨",
        title: "Drawing & Sketching",
        category: "Creative",
        description: "Express yourself using the interactive drawing canvas.",
        type: "drawing"
    },

    {
        id: 4,
        icon: "📸",
        title: "Photography",
        category: "Creative",
        description: "Choose a photography challenge and capture something interesting.",
        type: "photography"
    },

    {
        id: 5,
        icon: "🌱",
        title: "Gardening",
        category: "Nature",
        description: "Interact with a simple plant-care checklist.",
        type: "gardening"
    },

    {
        id: 6,
        icon: "🧘",
        title: "Meditation",
        category: "Relaxation",
        description: "Use a simple breathing and focus interaction without a timer.",
        type: "meditation"
    },

    {
        id: 7,
        icon: "💃",
        title: "Dancing",
        category: "Fitness",
        description: "Choose a movement challenge and mark the steps you complete.",
        type: "dancing"
    },

    {
        id: 8,
        icon: "🍳",
        title: "Try a New Recipe",
        category: "Cooking",
        description: "Build a simple recipe plan and check your ingredients.",
        type: "recipe"
    },

    {
        id: 9,
        icon: "📖",
        title: "Read a Book",
        category: "Learning",
        description: "Choose a reading goal and reflect on what you read.",
        type: "reading"
    },

    {
        id: 10,
        icon: "✍️",
        title: "Creative Writing",
        category: "Creative",
        description: "Use a writing prompt and create your own short response.",
        type: "writing"
    },

    {
        id: 11,
        icon: "🎤",
        title: "Singing",
        category: "Music",
        description: "Choose a song style and write the song you want to sing.",
        type: "singing"
    },

    {
        id: 12,
        icon: "🎸",
        title: "Learn an Instrument",
        category: "Music",
        description: "Choose a small practice goal for your instrument.",
        type: "instrument"
    },

    {
        id: 13,
        icon: "🧩",
        title: "Solve Puzzles",
        category: "Games",
        description: "Solve an interactive positive-word puzzle.",
        type: "puzzle"
    },

    {
        id: 14,
        icon: "♟️",
        title: "Play Chess",
        category: "Games",
        description: "Interact with a simple chessboard and make moves.",
        type: "chess"
    },

    {
        id: 15,
        icon: "🧶",
        title: "Try Arts & Crafts",
        category: "Creative",
        description: "Choose a craft idea and prepare your materials.",
        type: "craft"
    },

    {
        id: 16,
        icon: "🗣️",
        title: "Talk to a Friend",
        category: "Social",
        description: "Choose how you would like to connect with someone.",
        type: "friend"
    },

    {
        id: 17,
        icon: "🧳",
        title: "Explore a New Place",
        category: "Exploration",
        description: "Plan a small exploration using an interactive checklist.",
        type: "explore"
    },

    {
        id: 18,
        icon: "🏸",
        title: "Play a Sport",
        category: "Fitness",
        description: "Choose a sport and build a simple activity plan.",
        type: "sport"
    },

    {
        id: 19,
        icon: "🌿",
        title: "Spend Time in Nature",
        category: "Nature",
        description: "Complete a mindful nature observation.",
        type: "nature"
    },

    {
        id: 20,
        icon: "🧁",
        title: "Baking",
        category: "Cooking",
        description: "Choose a baking idea and prepare an ingredient checklist.",
        type: "baking"
    },

    {
        id: 21,
        icon: "📝",
        title: "Start a Personal Journal",
        category: "Personal",
        description: "Write a small personal reflection.",
        type: "journal"
    },

    {
        id: 22,
        icon: "🧑‍💻",
        title: "Learn a New Skill",
        category: "Learning",
        description: "Choose something new to learn and create a small goal.",
        type: "skill"
    },

    {
        id: 23,
        icon: "🎮",
        title: "Play a Casual Game",
        category: "Games",
        description: "Play an interactive matching game.",
        type: "game"
    },

    {
        id: 24,
        icon: "🛠️",
        title: "Try a DIY Project",
        category: "Creative",
        description: "Choose a DIY project and prepare the required steps.",
        type: "diy"
    },

    {
        id: 25,
        icon: "🌟",
        title: "Start a Personal Mini-Project",
        category: "Personal",
        description: "Create a small project plan and choose your first step.",
        type: "project"
    }

];


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "mindMirrorMoodBooster25";

let savedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

savedData.completed = savedData.completed || [];
savedData.completionDates = savedData.completionDates || {};
savedData.reflections = savedData.reflections || {};
savedData.notes = savedData.notes || {};
savedData.lastActivity = savedData.lastActivity || null;


/* =========================================================
   DAILY COMPLETION TRACKING
========================================================= */

function getLocalDateKey(date = new Date()) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function isActivityCompletedToday(activityId) {

    return (
        savedData.completionDates[activityId] ===
        getLocalDateKey()
    );

}

// ADD THE NEW FIREBASE CODE HERE

async function getAuthHeaders() {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please log in to save your activity.");
    }

    const token = await user.getIdToken();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

/* =========================================================
   SAVE ACTIVITY TO FIREBASE
========================================================= */

async function saveActivityToFirebase(activity) {
    if (!currentUser) {
        throw new Error("User is not logged in.");
    }

    const completionDate = getLocalDateKey();
    const completedAt = new Date().toISOString();

    const response = await fetch(API_URL, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
            activity_name: activity.title,
            activity_type: activity.category || "mood_booster",
            completed: true,
            completion_date: completionDate,
            completed_at: completedAt,
            reflection: selectedFeeling,
            notes: savedData.notes?.[activity.id] || ""
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save activity.");
    }

    return await response.json();
}



// YOUR EXISTING CODE CONTINUES BELOW



/* =========================================================
   DOM
========================================================= */

const activityGrid =
    document.getElementById("activityGrid");

const completedCount =
    document.getElementById("completedCount");

const progressPercent =
    document.getElementById("progressPercent");

const progressFill =
    document.getElementById("progressFill");

const activityPanel =
    document.getElementById("activityPanel");

const selectedIcon =
    document.getElementById("selectedIcon");

const selectedCategory =
    document.getElementById("selectedCategory");

const selectedTitle =
    document.getElementById("selectedTitle");

const selectedDescription =
    document.getElementById("selectedDescription");

const interactiveArea =
    document.getElementById("interactiveArea");

const reflectionArea =
    document.getElementById("reflectionArea");

const completeBtn =
    document.getElementById("completeBtn");

const closeBtn =
    document.getElementById("closeBtn");

const activityMessage =
    document.getElementById("activityMessage");


let selectedActivity = null;

let interactionCompleted = false;

let selectedFeeling = null;

let cleanupCurrentActivity = null;


/* =========================================================
   SAVE DATA
========================================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(savedData)
    );

}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    const count = firebaseCompletedActivities.size;

    const percentage = Math.round(
        (count / activities.length) * 100
    );

    completedCount.textContent = count;

    progressPercent.textContent = `${percentage}%`;

    progressFill.style.width = `${percentage}%`;

}
/* =========================================================
   GET COMPLETED ACTIVITIES FROM FIREBASE
========================================================= */

async function getMoodBoosterHistory() {

    const headers = await getAuthHeaders();

    const user = auth.currentUser;

    const response = await fetch(
        `${API_URL}/${user.uid}`,
        {
            method: "GET",
            headers: headers
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Failed to load activities."
        );
    }

    return result.activities || [];
}

function getActivityCompletionDate(activity) {
    const dateValue =
        activity.completion_date ||
        activity.completed_at ||
        activity.created_at ||
        activity.createdAt ||
        activity.timestamp ||
        activity.date ||
        activity.completion_date;

    if (!dateValue) {
        return null;
    }

    // Firebase timestamp format
    if (typeof dateValue === "object") {
        if (dateValue.seconds) {
            return getLocalDateKey(
                new Date(dateValue.seconds * 1000)
            );
        }

        if (dateValue._seconds) {
            return getLocalDateKey(
                new Date(dateValue._seconds * 1000)
            );
        }
    }

    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return getLocalDateKey(parsedDate);
}
/* =========================================================
   LOAD FIREBASE MOOD BOOSTER PROGRESS
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        currentUser = null;
        firebaseCompletedActivities.clear();

        updateProgress();
        renderActivities();

        return;
    }
    try {

        const activitiesFromFirebase =
            await getMoodBoosterHistory();

        firebaseCompletedActivities.clear();

        activitiesFromFirebase.forEach(activity => {
            if (activity.completed !== true) {
                return;
            }

            const completionDate = getActivityCompletionDate(activity);

            if (completionDate === getLocalDateKey()) {
                firebaseCompletedActivities.add(activity.activity_name);
            }
        });

        updateProgress();

    } catch (error) {

        console.error(
            "Failed to load Mood Booster progress:",
            error
        );

    }

});
/* =========================================================
   RENDER
========================================================= */

function renderActivities(category = "All") {

    activityGrid.innerHTML = "";

    const filtered =
        category === "All"
            ? activities
            : activities.filter(
                activity =>
                    activity.category === category
            );

    filtered.forEach(activity => {

        const card =
            document.createElement("div");

        card.className =
            "activity-card";

        const completed =
            isActivityCompletedToday(activity.id) ||
            firebaseCompletedActivities.has(activity.title)

        if (completed) {

            card.classList.add(
                "completed"
            );

        }

        card.innerHTML = `

            ${completed
                ? `
                        <span class="completed-badge">
                            ✓ Completed
                        </span>
                    `
                : ""
            }

            <div class="activity-icon">
                ${activity.icon}
            </div>

            <span class="activity-category">
                ${activity.category}
            </span>

            <h3>
                ${activity.title}
            </h3>

            <p>
                ${activity.description}
            </p>

        `;

        card.addEventListener(
            "click",
            () => openActivity(activity)
        );

        activityGrid.appendChild(card);

    });

}


/* =========================================================
   OPEN ACTIVITY
========================================================= */

function openActivity(activity) {

    if (
        typeof cleanupCurrentActivity ===
        "function"
    ) {

        cleanupCurrentActivity();

        cleanupCurrentActivity =
            null;

    }

    selectedActivity =
        activity;

    interactionCompleted =
        false;

    selectedFeeling =
        null;

    selectedIcon.textContent =
        activity.icon;

    selectedCategory.textContent =
        activity.category;

    selectedTitle.textContent =
        activity.title;

    selectedDescription.textContent =
        activity.description;

    activityMessage.textContent =
        "";

    reflectionArea.classList.add(
        "hidden"
    );

    completeBtn.disabled =
        true;

    createInteractiveActivity(
        activity
    );

    activityPanel.classList.remove(
        "hidden"
    );

    activityPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================================
   COMPLETE INTERACTION
========================================================= */

function finishInteraction(message) {

    interactionCompleted =
        true;

    reflectionArea.classList.remove(
        "hidden"
    );

    completeBtn.disabled =
        !selectedFeeling;

    activityMessage.textContent =
        message;

}


/* =========================================================
   ACTIVITY ROUTER
========================================================= */

function createInteractiveActivity(activity) {

    switch (activity.type) {

        case "walk":
            createWalk();
            break;

        case "music":
            createMusic();
            break;

        case "drawing":
            createDrawing();
            break;

        case "photography":
            createPhotography();
            break;

        case "gardening":
            createGardening();
            break;

        case "meditation":
            createMeditation();
            break;

        case "dancing":
            createDancing();
            break;

        case "recipe":
            createRecipe();
            break;

        case "reading":
            createReading();
            break;

        case "writing":
            createWriting();
            break;

        case "singing":
            createSinging();
            break;

        case "instrument":
            createInstrument();
            break;

        case "puzzle":
            createPuzzle();
            break;

        case "chess":
            createChess();
            break;

        case "craft":
            createCraft();
            break;

        case "friend":
            createFriend();
            break;

        case "explore":
            createExplore();
            break;

        case "sport":
            createSport();
            break;

        case "nature":
            createNature();
            break;

        case "baking":
            createBaking();
            break;

        case "journal":
            createJournal();
            break;

        case "skill":
            createSkill();
            break;

        case "game":
            createGame();
            break;

        case "diy":
            createDIY();
            break;

        case "project":
            createProject();
            break;

    }

}


/* =========================================================
   1. WALK
========================================================= */

function createWalk() {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>🚶 Mindful Walk</h3>

            <p>
                During your walk, notice the things around you.
                Check each observation when you notice it.
            </p>

            <div class="checklist">

                <label class="check-item">
                    <input type="checkbox">
                    <span>I noticed something colourful.</span>
                </label>

                <label class="check-item">
                    <input type="checkbox">
                    <span>I noticed a sound around me.</span>
                </label>

                <label class="check-item">
                    <input type="checkbox">
                    <span>I noticed something moving.</span>
                </label>

                <label class="check-item">
                    <input type="checkbox">
                    <span>I noticed how my body felt.</span>
                </label>

            </div>

        </div>

    `;

    setupChecklist();

}


/* =========================================================
   2. MUSIC
========================================================= */

function createMusic() {

    const songs = [

        {
            title: "Calm Music 1",
            file: "Audio/MoodBooster/song1.mp3"
        },

        {
            title: "Calm Music 2",
            file: "Audio/MoodBooster/song2.mp3"
        },

        {
            title: "Peaceful Music 3",
            file: "Audio/MoodBooster/song3.mp3"
        },

        {
            title: "Relaxing Music 4",
            file: "Audio/MoodBooster/song4.mp3"
        },

        {
            title: "Nature Music 5",
            file: "Audio/MoodBooster/song5.mp3"
        },

        {
            title: "Soft Music 6",
            file: "Audio/MoodBooster/song6.mp3"
        },

        {
            title: "Peaceful Music 7",
            file: "Audio/MoodBooster/song7.mp3"
        },

        {
            title: "Calm Music 8",
            file: "Audio/MoodBooster/song8.mp3"
        },

        {
            title: "Relaxing Music 9",
            file: "Audio/MoodBooster/song9.mp3"
        },

        {
            title: "Sleepy Music 10",
            file: "Audio/MoodBooster/song10.mp3"
        },

        {
            title: "Peaceful Music 11",
            file: "Audio/MoodBooster/song11.mp3"
        },

        {
            title: "Calm Music 12",
            file: "Audio/MoodBooster/song12.mp3"
        }

    ];

    let currentSong = 0;

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <div class="music-player-heading">

                <div class="music-player-icon">
                    🎵
                </div>

                <div>

                    <h3>
                        Music for Your Moment
                    </h3>

                    <p>
                        Choose any track and enjoy your moment.
                    </p>

                </div>

            </div>


            <div class="now-playing">

                <span class="music-small-label">
                    NOW PLAYING
                </span>

                <h4 id="musicTitle">
                    ${songs[0].title}
                </h4>

            </div>


            <audio
                id="moodAudio"
                controls
                preload="metadata"
            >
                <source
                    src="${songs[0].file}"
                    type="audio/mpeg"
                >
            </audio>


            <div class="music-controls">

                <button
                    type="button"
                    id="previousSong"
                    class="music-control-btn"
                >
                    ⏮
                </button>

                <button
                    type="button"
                    id="playPauseSong"
                    class="music-control-btn main-play-btn"
                >
                    ▶
                </button>

                <button
                    type="button"
                    id="nextSong"
                    class="music-control-btn"
                >
                    ⏭
                </button>

            </div>


            <div class="music-section-title">

                <span>
                    Choose a song
                </span>

                <span>
                    12 tracks
                </span>

            </div>


            <div class="song-list">

                ${songs.map(
        (song, index) => `

                        <button
                            type="button"
                            class="song-item ${index === 0
                ? "active"
                : ""
            }"
                            data-index="${index}"
                        >

                            <span class="song-number">
                                ${index + 1}
                            </span>

                            <span class="song-details">

                                <strong>
                                    ${song.title}
                                </strong>

                                <small>
                                    MindMirror Mood Booster
                                </small>

                            </span>

                            <span class="song-play-icon">
                                ▶
                            </span>

                        </button>

                    `
    ).join("")}

            </div>

            <div class="music-note">
                💜 Choose the music that feels comfortable
                for you.
            </div>

        </div>

    `;


    const audio =
        document.getElementById(
            "moodAudio"
        );

    const title =
        document.getElementById(
            "musicTitle"
        );

    const play =
        document.getElementById(
            "playPauseSong"
        );

    const previous =
        document.getElementById(
            "previousSong"
        );

    const next =
        document.getElementById(
            "nextSong"
        );

    const songButtons =
        document.querySelectorAll(
            ".song-item"
        );


    function loadSong(
        index,
        shouldPlay = false
    ) {

        currentSong =
            index;

        audio.src =
            songs[index].file;

        title.textContent =
            songs[index].title;

        songButtons.forEach(
            button =>
                button.classList.remove(
                    "active"
                )
        );

        songButtons[index].classList.add(
            "active"
        );

        audio.load();

        if (shouldPlay) {

            audio.play()
                .then(() => {

                    play.textContent =
                        "⏸";

                })
                .catch(() => { });

        }

    }



    play.addEventListener(
        "click",
        () => {

            if (audio.paused) {

                audio.play()
                    .then(() => {

                        play.textContent = "⏸";

                        activityMessage.textContent =
                            "Music is playing. Enjoy your moment.";

                    })
                    .catch(() => {

                        activityMessage.textContent =
                            "The audio file could not be played.";

                    });

            } else {

                audio.pause();

                play.textContent = "▶";

            }

        }
    );



    previous.addEventListener(
        "click",
        () => {

            currentSong =
                currentSong > 0
                    ? currentSong - 1
                    : songs.length - 1;

            loadSong(
                currentSong,
                true
            );

        }
    );


    next.addEventListener(
        "click",
        () => {

            currentSong =
                currentSong <
                    songs.length - 1
                    ? currentSong + 1
                    : 0;

            loadSong(
                currentSong,
                true
            );

        }
    );


    songButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    loadSong(
                        Number(
                            button.dataset.index
                        ),
                        true
                    );

                }
            );

        }
    );



    audio.addEventListener("ended", () => {
        activityMessage.textContent =
            "Music finished! Select how you feel, then click Complete Activity when you're ready.";
    });



    audio.addEventListener(
        "pause",
        () => {

            play.textContent =
                "▶";

        }
    );


    audio.addEventListener(
        "play",
        () => {

            play.textContent =
                "⏸";

        }
    );


    cleanupCurrentActivity = () => {

        audio.pause();

        audio.src = "";

    };

}


/* =========================================================
   3. DRAWING
========================================================= */

function createDrawing() {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>🎨 Draw Something</h3>

            <p>
                Use the canvas to draw anything you feel like creating.
            </p>

            <div class="drawing-tools">

                <button
                    type="button"
                    class="tool-btn active"
                    id="brushTool"
                >
                    ✏️ Brush
                </button>

                <button
                    type="button"
                    class="tool-btn"
                    id="eraserTool"
                >
                    🧹 Eraser
                </button>

                <button
                    type="button"
                    class="tool-btn"
                    id="clearCanvas"
                >
                    Clear
                </button>

                <input
                    type="range"
                    class="brush-size"
                    id="brushSize"
                    min="2"
                    max="25"
                    value="5"
                    aria-label="Brush size"
                >

            </div>

            <canvas
                id="drawingCanvas"
                class="drawing-canvas"
            ></canvas>

            <div class="choice-grid">

                <button
                    type="button"
                    class="choice-btn"
                    id="finishDrawing"
                >
                    ✓ Finish Drawing
                </button>

            </div>

        </div>

    `;


    const canvas =
        document.getElementById(
            "drawingCanvas"
        );

    const context =
        canvas.getContext("2d");

    const brush =
        document.getElementById(
            "brushTool"
        );

    const eraser =
        document.getElementById(
            "eraserTool"
        );

    const clear =
        document.getElementById(
            "clearCanvas"
        );

    const size =
        document.getElementById(
            "brushSize"
        );

    const finish =
        document.getElementById(
            "finishDrawing"
        );


    function resizeCanvas() {

        const rect =
            canvas.getBoundingClientRect();

        const ratio =
            window.devicePixelRatio || 1;

        const oldImage =
            canvas.width &&
                canvas.height
                ? canvas.toDataURL()
                : null;

        canvas.width =
            rect.width * ratio;

        canvas.height =
            rect.height * ratio;

        context.scale(
            ratio,
            ratio
        );

        context.lineCap =
            "round";

        context.lineJoin =
            "round";

        if (oldImage) {

            const image =
                new Image();

            image.onload =
                () => {

                    context.drawImage(
                        image,
                        0,
                        0,
                        rect.width,
                        rect.height
                    );

                };

            image.src =
                oldImage;

        }

    }


    resizeCanvas();


    let drawing =
        false;

    let mode =
        "brush";


    function getPosition(event) {

        const rect =
            canvas.getBoundingClientRect();

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

    }


    canvas.addEventListener(
        "pointerdown",
        event => {

            drawing = true;

            canvas.setPointerCapture(
                event.pointerId
            );

            const position =
                getPosition(event);

            context.beginPath();

            context.moveTo(
                position.x,
                position.y
            );

        }
    );


    canvas.addEventListener(
        "pointermove",
        event => {

            if (!drawing) return;

            const position =
                getPosition(event);

            context.strokeStyle =
                mode === "eraser"
                    ? "#FFFFFF"
                    : "#7357A8";

            context.lineWidth =
                Number(size.value);

            context.lineTo(
                position.x,
                position.y
            );

            context.stroke();

        }
    );


    canvas.addEventListener(
        "pointerup",
        () => {

            drawing = false;

        }
    );


    canvas.addEventListener(
        "pointercancel",
        () => {

            drawing = false;

        }
    );


    brush.addEventListener(
        "click",
        () => {

            mode =
                "brush";

            brush.classList.add(
                "active"
            );

            eraser.classList.remove(
                "active"
            );

        }
    );


    eraser.addEventListener(
        "click",
        () => {

            mode =
                "eraser";

            eraser.classList.add(
                "active"
            );

            brush.classList.remove(
                "active"
            );

        }
    );


    clear.addEventListener(
        "click",
        () => {

            const rect =
                canvas.getBoundingClientRect();

            context.clearRect(
                0,
                0,
                rect.width,
                rect.height
            );

        }
    );


    finish.addEventListener(
        "click",
        () => {

            finishInteraction(
                "Your drawing is complete."
            );

        }
    );


    window.addEventListener(
        "resize",
        resizeCanvas
    );


    cleanupCurrentActivity = () => {

        window.removeEventListener(
            "resize",
            resizeCanvas
        );

    };

}


/* =========================================================
   4. PHOTOGRAPHY
========================================================= */

function createPhotography() {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>📸 Photography Challenge</h3>

            <p>
                Choose something around you and capture it with your phone.
            </p>

            <div class="choice-grid">

                <button class="choice-btn">
                    🌿 Nature
                </button>

                <button class="choice-btn">
                    🎨 Something colourful
                </button>

                <button class="choice-btn">
                    ☀️ Something beautiful
                </button>

                <button class="choice-btn">
                    🔍 Something unusual
                </button>

            </div>

            <label
                style="
                    display:block;
                    margin-top:18px;
                    font-size:12px;
                    color:#77727F;
                "
            >
                Optional: upload the photo you captured.
            </label>

            <input
                type="file"
                id="photoInput"
                accept="image/*"
                class="interactive-input"
                style="min-height:auto;margin-top:8px;"
            >

            <div
                id="photoPreview"
                style="margin-top:15px;"
            ></div>

        </div>

    `;


    setupChoiceButtons();


    const input =
        document.getElementById(
            "photoInput"
        );

    const preview =
        document.getElementById(
            "photoPreview"
        );


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files[0];

            if (!file) return;

            const reader =
                new FileReader();

            reader.onload =
                event => {

                    preview.innerHTML = `

                        <img
                            src="${event.target.result}"
                            alt="Selected photography activity"
                            style="
                                width:100%;
                                max-height:280px;
                                object-fit:contain;
                                border-radius:14px;
                                border:1px solid #E6DEF3;
                                background:#FFFFFF;
                            "
                        >

                        <p class="interaction-complete">
                            ✓ Photo selected.
                        </p>

                    `;

                    finishInteraction(
                        "Your photography activity is ready to complete."
                    );

                };

            reader.readAsDataURL(file);

        }
    );

}


/* =========================================================
   5. GARDENING
========================================================= */

function createGardening() {

    createChecklistActivity(
        "🌱 Plant Care",
        "Choose the small plant-care actions you would like to do.",
        [
            "Water a plant",
            "Remove dry leaves",
            "Check the soil",
            "Move the plant somewhere comfortable"
        ]
    );

}


/* =========================================================
   6. MEDITATION
========================================================= */

function createMeditation() {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>🧘 Mindful Breathing</h3>

            <p>
                Tap the circle slowly. Let it expand while you breathe in
                and return while you breathe out.
            </p>

            <div
                id="breathingOrb"
                class="breathing-orb"
            >
                Tap
            </div>

            <p
                id="breathingText"
                style="text-align:center;"
            >
                Tap the circle to begin.
            </p>

            <div class="choice-grid">

                <button
                    type="button"
                    class="choice-btn"
                    id="finishMeditation"
                >
                    ✓ Finish Mindful Moment
                </button>

            </div>

        </div>

    `;


    const orb =
        document.getElementById(
            "breathingOrb"
        );

    const text =
        document.getElementById(
            "breathingText"
        );

    const finish =
        document.getElementById(
            "finishMeditation"
        );


    let expanded =
        false;

    orb.addEventListener(
        "click",
        () => {

            expanded =
                !expanded;

            orb.classList.toggle(
                "expanded",
                expanded
            );

            text.textContent =
                expanded
                    ? "Breathe in gently."
                    : "Breathe out gently.";

        }
    );


    finish.addEventListener(
        "click",
        () => {

            finishInteraction(
                "Mindful breathing completed."
            );

        }
    );

}


/* =========================================================
   7. DANCING
========================================================= */

function createDancing() {

    createChecklistActivity(
        "💃 Movement Challenge",
        "Choose the movements that feel comfortable for you.",
        [
            "Play a favourite song",
            "Move your shoulders",
            "Move your arms",
            "Try a simple dance step",
            "Freestyle for a while"
        ]
    );

}


/* =========================================================
   8. RECIPE
========================================================= */

function createRecipe() {

    createChecklistActivity(
        "🍳 Recipe Builder",
        "Choose a simple recipe and prepare what you need.",
        [
            "Choose a recipe",
            "Check the ingredients",
            "Prepare the workspace",
            "Start cooking",
            "Enjoy what you created"
        ]
    );

}


/* =========================================================
   9. READING
========================================================= */

function createReading() {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>📖 Reading Moment</h3>

            <p>
                What would you like to read today?
            </p>

            <input
                id="readingBook"
                class="interactive-input"
                style="min-height:auto;"
                placeholder="Book or article name"
            >

            <div class="choice-grid">

                <button
                    type="button"
                    class="choice-btn"
                    data-reading="story"
                >
                    📚 Story
                </button>

                <button
                    type="button"
                    class="choice-btn"
                    data-reading="learning"
                >
                    🧠 Learning
                </button>

                <button
                    type="button"
                    class="choice-btn"
                    data-reading="inspiration"
                >
                    ✨ Inspiration
                </button>

            </div>

            <div
                id="readingResult"
                class="interaction-complete"
            ></div>

        </div>

    `;


    const input =
        document.getElementById(
            "readingBook"
        );

    const result =
        document.getElementById(
            "readingResult"
        );


    document
        .querySelectorAll(
            "[data-reading]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        !input.value.trim()
                    ) {

                        input.focus();

                        result.textContent =
                            "Enter a book or article first.";

                        return;

                    }

                    document
                        .querySelectorAll(
                            "[data-reading]"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "selected"
                                )
                        );

                    button.classList.add(
                        "selected"
                    );

                    result.textContent =
                        "✓ Reading choice selected.";

                    finishInteraction(
                        "Your reading activity is ready."
                    );

                }
            );

        });

}


/* =========================================================
   10. CREATIVE WRITING
========================================================= */

function createWriting() {

    createWritingActivity(
        "✍️ Creative Writing",
        "Complete this prompt: “If today could become a story...”"
    );

}


/* =========================================================
   11. SINGING
========================================================= */

function createSinging() {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>🎤 Singing Moment</h3>

            <p>
                Choose the type of song you would like to sing.
            </p>

            <div class="choice-grid">

                <button class="choice-btn">
                    😊 Happy
                </button>

                <button class="choice-btn">
                    💜 Calm
                </button>

                <button class="choice-btn">
                    ⚡ Energetic
                </button>

                <button class="choice-btn">
                    🎵 Favourite song
                </button>

            </div>

            <input
                id="singingSong"
                class="interactive-input"
                style="min-height:auto;margin-top:15px;"
                placeholder="Song you want to sing"
            >

            <div class="choice-grid">

                <button
                    id="finishSinging"
                    class="choice-btn"
                >
                    🎤 I Sang
                </button>

            </div>

        </div>

    `;


    setupChoiceButtons();


    document
        .getElementById(
            "finishSinging"
        )
        .addEventListener(
            "click",
            () => {

                finishInteraction(
                    "Nice! Your singing activity is complete."
                );

            }
        );

}


/* =========================================================
   12. INSTRUMENT
========================================================= */

function createInstrument() {

    createWritingActivity(
        "🎸 Instrument Practice",
        "Write one small thing you would like to practice today."
    );

}


/* =========================================================
   13. PUZZLE
========================================================= */

function createPuzzle() {

    const words = [
        "CALM",
        "HOPE",
        "SMILE",
        "PEACE"
    ];

    const word =
        words[
        Math.floor(
            Math.random() * words.length
        )
        ];

    let scrambled =
        word
            .split("")
            .sort(
                () => Math.random() - 0.5
            )
            .join("");

    if (scrambled === word) {

        scrambled =
            word
                .split("")
                .reverse()
                .join("");

    }


    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>🧩 Unscramble the Word</h3>

            <p>
                Rearrange the letters to find the positive word.
            </p>

            <h2
                style="
                    text-align:center;
                    color:#7357A8;
                    letter-spacing:8px;
                "
            >
                ${scrambled}
            </h2>

            <input
                id="puzzleAnswer"
                class="interactive-input"
                style="min-height:auto;"
                placeholder="Your answer"
            >

            <div class="choice-grid">

                <button
                    id="checkPuzzle"
                    class="choice-btn"
                >
                    Check Answer
                </button>

            </div>

            <p id="puzzleResult"></p>

        </div>

    `;


    document
        .getElementById(
            "checkPuzzle"
        )
        .addEventListener(
            "click",
            () => {

                const answer =
                    document
                        .getElementById(
                            "puzzleAnswer"
                        )
                        .value
                        .trim()
                        .toUpperCase();

                const result =
                    document.getElementById(
                        "puzzleResult"
                    );

                if (
                    answer === word
                ) {

                    result.textContent =
                        "✓ Correct! Great job.";

                    result.className =
                        "interaction-complete";

                    finishInteraction(
                        "Puzzle completed successfully."
                    );

                } else {

                    result.textContent =
                        "Not quite. Try again.";

                    result.className =
                        "";

                }

            }
        );

}


/* =========================================================
   14. CHESS
========================================================= */

function createChess() {

    const pieces = [
        "♜",
        "♞",
        "♝",
        "♛",
        "♚",
        "♝",
        "♞",
        "♜",
        "♟",
        "♟",
        "♟",
        "♟",
        "♟",
        "♟",
        "♟",
        "♟",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "♙",
        "♙",
        "♙",
        "♙",
        "♙",
        "♙",
        "♙",
        "♙",
        "♖",
        "♘",
        "♗",
        "♕",
        "♔",
        "♗",
        "♘",
        "♖"
    ];


    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>♟️ Chess Board</h3>

            <p>
                Select a piece and then select another square
                to move it around the board.
            </p>

            <div
                id="chessBoard"
                class="chess-board"
            ></div>

            <p
                id="chessMessage"
                style="text-align:center;"
            >
                Select a piece to begin.
            </p>

        </div>

    `;


    const board =
        document.getElementById(
            "chessBoard"
        );

    const message =
        document.getElementById(
            "chessMessage"
        );


    let selected =
        null;


    pieces.forEach(
        (piece, index) => {

            const square =
                document.createElement(
                    "button"
                );

            square.type =
                "button";

            square.className =
                "chess-square";

            const row =
                Math.floor(
                    index / 8
                );

            const col =
                index % 8;

            if (
                (row + col) % 2 === 0
            ) {

                square.classList.add(
                    "light"
                );

            } else {

                square.classList.add(
                    "dark"
                );

            }

            square.textContent =
                piece;

            square.dataset.index =
                index;


            square.addEventListener(
                "click",
                () => {

                    if (
                        selected === null
                    ) {

                        if (!piece) {

                            message.textContent =
                                "Choose a square containing a piece.";

                            return;

                        }

                        selected =
                            index;

                        square.classList.add(
                            "selected"
                        );

                        message.textContent =
                            "Now choose a destination square.";

                    } else {

                        pieces[index] =
                            pieces[selected];

                        pieces[selected] =
                            "";

                        renderChess();

                        selected =
                            null;

                        message.textContent =
                            "Move made. You can continue playing.";

                        finishInteraction(
                            "You interacted with the chessboard."
                        );

                    }

                }
            );


            board.appendChild(
                square
            );

        }
    );


    function renderChess() {

        board.innerHTML = "";

        pieces.forEach(
            (piece, index) => {

                const square =
                    document.createElement(
                        "button"
                    );

                square.type =
                    "button";

                square.className =
                    "chess-square";

                const row =
                    Math.floor(
                        index / 8
                    );

                const col =
                    index % 8;

                square.classList.add(
                    (row + col) % 2 === 0
                        ? "light"
                        : "dark"
                );

                square.textContent =
                    piece;

                square.addEventListener(
                    "click",
                    () => {

                        if (
                            selected === null
                        ) {

                            if (!piece) return;

                            selected =
                                index;

                            square.classList.add(
                                "selected"
                            );

                        } else {

                            pieces[index] =
                                pieces[selected];

                            pieces[selected] =
                                "";

                            selected =
                                null;

                            renderChess();

                            finishInteraction(
                                "Chess move completed."
                            );

                        }

                    }
                );

                board.appendChild(
                    square
                );

            }
        );

    }

}


/* =========================================================
   15. ARTS & CRAFTS
========================================================= */

function createCraft() {

    createChecklistActivity(
        "🧶 Craft Builder",
        "Choose a craft and prepare the materials you need.",
        [
            "Choose a craft idea",
            "Collect materials",
            "Prepare your workspace",
            "Start creating",
            "Take a moment to appreciate your work"
        ]
    );

}


/* =========================================================
   16. FRIEND
========================================================= */

function createFriend() {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>🗣️ Connect With Someone</h3>

            <p>
                Choose how you would like to connect.
            </p>

            <div class="choice-grid">

                <button class="choice-btn">
                    📞 Call
                </button>

                <button class="choice-btn">
                    💬 Message
                </button>

                <button class="choice-btn">
                    🤝 Meet
                </button>

            </div>

            <textarea
                id="friendMessage"
                class="interactive-input"
                placeholder="Optional: write what you would like to say..."
            ></textarea>

        </div>

    `;

    setupChoiceButtons();

}


/* =========================================================
   17. EXPLORE
========================================================= */

function createExplore() {

    createChecklistActivity(
        "🧳 Explore Somewhere New",
        "Plan a small exploration.",
        [
            "Choose a safe nearby place",
            "Check how to reach it",
            "Take what you need",
            "Notice something new",
            "Write one thing you discovered"
        ]
    );

}


/* =========================================================
   18. SPORT
========================================================= */

function createSport() {

    createChecklistActivity(
        "🏸 Sport Activity",
        "Choose a physical activity that feels comfortable.",
        [
            "Badminton",
            "Walking",
            "Cycling",
            "Football",
            "Stretching"
        ]
    );

}


/* =========================================================
   19. NATURE
========================================================= */

function createNature() {

    createChecklistActivity(
        "🌿 Nature Observation",
        "Look around you and notice the natural details.",
        [
            "I noticed a plant",
            "I noticed the sky",
            "I noticed a sound",
            "I noticed something moving",
            "I noticed something beautiful"
        ]
    );

}


/* =========================================================
   20. BAKING
========================================================= */

function createBaking() {

    createChecklistActivity(
        "🧁 Baking Builder",
        "Choose a simple baking plan.",
        [
            "Choose what to bake",
            "Collect ingredients",
            "Prepare the workspace",
            "Follow the recipe",
            "Enjoy what you created"
        ]
    );

}


/* =========================================================
   21. JOURNAL
========================================================= */

function createJournal() {

    createWritingActivity(
        "📝 Personal Journal",
        "Write one thing you appreciate, noticed, or experienced today."
    );

}


/* =========================================================
   22. SKILL
========================================================= */

function createSkill() {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>🧑‍💻 Learn Something New</h3>

            <p>
                Choose a skill you would like to explore.
            </p>

            <div class="choice-grid">

                <button class="choice-btn">
                    💻 Technology
                </button>

                <button class="choice-btn">
                    🎨 Creative
                </button>

                <button class="choice-btn">
                    🗣️ Communication
                </button>

                <button class="choice-btn">
                    🍳 Cooking
                </button>

                <button class="choice-btn">
                    🎵 Music
                </button>

            </div>

            <input
                id="skillInput"
                class="interactive-input"
                style="min-height:auto;margin-top:15px;"
                placeholder="Specific skill you want to learn"
            >

        </div>

    `;

    setupChoiceButtons();

}


/* =========================================================
   23. CASUAL GAME
========================================================= */

function createGame() {

    const symbols = [
        "🌸",
        "🌸",
        "⭐",
        "⭐",
        "🌿",
        "🌿",
        "💜",
        "💜"
    ];


    const shuffled =
        [...symbols].sort(
            () => Math.random() - 0.5
        );


    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>🎮 Match the Pairs</h3>

            <p>
                Find all matching pairs.
            </p>

            <div
                id="memoryBoard"
                class="memory-board"
            ></div>

            <p
                id="memoryMessage"
                style="text-align:center;"
            >
                Find the matching pairs.
            </p>

        </div>

    `;


    const board =
        document.getElementById(
            "memoryBoard"
        );

    const message =
        document.getElementById(
            "memoryMessage"
        );


    let first =
        null;

    let second =
        null;

    let locked =
        false;

    let matched =
        0;


    shuffled.forEach(
        symbol => {

            const card =
                document.createElement(
                    "button"
                );

            card.type =
                "button";

            card.className =
                "memory-card";

            card.textContent =
                symbol;

            card.dataset.symbol =
                symbol;

            card.addEventListener(
                "click",
                () => {

                    if (
                        locked ||
                        card.classList.contains(
                            "matched"
                        ) ||
                        card === first
                    ) {

                        return;

                    }

                    card.classList.add(
                        "revealed"
                    );

                    if (!first) {

                        first =
                            card;

                        return;

                    }

                    second =
                        card;

                    if (
                        first.dataset.symbol ===
                        second.dataset.symbol
                    ) {

                        first.classList.add(
                            "matched"
                        );

                        second.classList.add(
                            "matched"
                        );

                        matched += 2;

                        first =
                            null;

                        second =
                            null;

                        if (
                            matched ===
                            shuffled.length
                        ) {

                            message.textContent =
                                "✓ All pairs matched!";

                            finishInteraction(
                                "Matching game completed."
                            );

                        }

                    } else {

                        locked =
                            true;

                        setTimeout(
                            () => {

                                first.classList.remove(
                                    "revealed"
                                );

                                second.classList.remove(
                                    "revealed"
                                );

                                first =
                                    null;

                                second =
                                    null;

                                locked =
                                    false;

                            },
                            500
                        );

                    }

                }
            );

            board.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   24. DIY
========================================================= */

function createDIY() {

    createChecklistActivity(
        "🛠️ DIY Project",
        "Build your own simple DIY plan.",
        [
            "Choose what to make",
            "Collect materials",
            "Prepare your workspace",
            "Build or create",
            "Check your finished project"
        ]
    );

}


/* =========================================================
   25. PERSONAL MINI PROJECT
========================================================= */

function createProject() {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>🌟 Create Your Mini-Project</h3>

            <p>
                Give your small project a name and choose your first step.
            </p>

            <input
                id="projectName"
                class="interactive-input"
                style="min-height:auto;"
                placeholder="Project name"
            >

            <div class="choice-grid">

                <button class="choice-btn">
                    🎨 Creative
                </button>

                <button class="choice-btn">
                    💻 Digital
                </button>

                <button class="choice-btn">
                    📚 Learning
                </button>

                <button class="choice-btn">
                    🌱 Personal
                </button>

            </div>

            <textarea
                id="projectStep"
                class="interactive-input"
                placeholder="What is the first small step?"
            ></textarea>

            <div class="choice-grid">

                <button
                    type="button"
                    id="saveProject"
                    class="choice-btn"
                >
                    Create My Plan
                </button>

            </div>

        </div>

    `;


    setupChoiceButtons();


    document
        .getElementById(
            "saveProject"
        )
        .addEventListener(
            "click",
            () => {

                const name =
                    document
                        .getElementById(
                            "projectName"
                        )
                        .value
                        .trim();

                const step =
                    document
                        .getElementById(
                            "projectStep"
                        )
                        .value
                        .trim();

                if (!name || !step) {

                    activityMessage.textContent =
                        "Add a project name and first step.";

                    return;

                }

                savedData.notes[
                    selectedActivity.id
                ] = {
                    name,
                    step
                };

                saveData();

                finishInteraction(
                    "Your mini-project plan has been created."
                );

            }
        );

}


/* =========================================================
   GENERIC CHECKLIST
========================================================= */

function createChecklistActivity(
    title,
    description,
    items
) {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>${title}</h3>

            <p>${description}</p>

            <div class="checklist">

                ${items.map(
        item => `

                        <label class="check-item">

                            <input
                                type="checkbox"
                            >

                            <span>
                                ${item}
                            </span>

                        </label>

                    `
    ).join("")}

            </div>

        </div>

    `;

    setupChecklist();

}


/* =========================================================
   CHECKLIST LOGIC
========================================================= */

function setupChecklist() {

    const checks =
        interactiveArea.querySelectorAll(
            ".check-item input"
        );

    checks.forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                () => {

                    const checked = [...checks].filter(item => item.checked).length;

                    if (checked > 0) {
                        finishInteraction("Great! You selected your activity.");
                    }

                }
            );

        }
    );

}


/* =========================================================
   GENERIC CHOICE BUTTONS
========================================================= */

function setupChoiceButtons() {

    const buttons =
        interactiveArea.querySelectorAll(
            ".choice-btn"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        item =>
                            item.classList.remove(
                                "selected"
                            )
                    );

                    button.classList.add(
                        "selected"
                    );

                    finishInteraction(
                        "Your choice has been selected."
                    );

                }
            );

        }
    );

}


/* =========================================================
   WRITING ACTIVITY
========================================================= */

function createWritingActivity(
    title,
    description
) {

    interactiveArea.innerHTML = `

        <div class="interactive-card">

            <h3>${title}</h3>

            <p>${description}</p>

            <textarea
                id="writingInput"
                class="interactive-input"
                placeholder="Write your thoughts here..."
            ></textarea>

            <div class="choice-grid">

                <button
                    type="button"
                    id="saveWriting"
                    class="choice-btn"
                >
                    Save Reflection
                </button>

            </div>

        </div>

    `;


    document
        .getElementById(
            "saveWriting"
        )
        .addEventListener(
            "click",
            () => {

                const value =
                    document
                        .getElementById(
                            "writingInput"
                        )
                        .value
                        .trim();

                if (!value) {

                    activityMessage.textContent =
                        "Write something before continuing.";

                    return;

                }

                savedData.notes[
                    selectedActivity.id
                ] = value;

                saveData();

                finishInteraction(
                    "Your reflection has been saved."
                );

            }
        );

}


/* =========================================================
   FEELING SELECTION
========================================================= */

document
    .querySelectorAll(
        ".feeling-options button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".feeling-options button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "selected"
                                )
                        );

                    button.classList.add(
                        "selected"
                    );

                    selectedFeeling =
                        button.dataset.feeling;

                    completeBtn.disabled =
                        !interactionCompleted;

                }
            );

        }
    );



/* =========================================================
   COMPLETE ACTIVITY
========================================================= */

completeBtn.addEventListener("click", async () => {

    if (
        !selectedActivity ||
        !interactionCompleted ||
        !selectedFeeling
    ) {
        return;
    }

    completeBtn.disabled = true;
    activityMessage.textContent = "Saving activity...";

    // Save locally first
    const today = getLocalDateKey();

    if (!savedData.completed.includes(selectedActivity.id)) {
        savedData.completed.push(selectedActivity.id);
    }

    savedData.completionDates[selectedActivity.id] = today;
    savedData.reflections[selectedActivity.id] = selectedFeeling;
    savedData.lastActivity = selectedActivity.title;

    // Update today's progress immediately
    firebaseCompletedActivities.add(selectedActivity.title);

    saveData();
    updateProgress();
    renderActivities();
    try {

        // Save activity to Firebase through Flask
        await saveActivityToFirebase(selectedActivity);

        updateProgress();
        renderActivities();

        activityMessage.textContent =
            "✓ Activity completed and saved to Firebase.";

    } catch (error) {

        console.error("Firebase save error:", error);

        activityMessage.textContent =
            "Activity saved locally, but Firebase failed: " +
            error.message;

    }

});



/* =========================================================
   CLOSE
========================================================= */

closeBtn.addEventListener(
    "click",
    () => {

        if (
            typeof cleanupCurrentActivity ===
            "function"
        ) {

            cleanupCurrentActivity();

            cleanupCurrentActivity =
                null;

        }

        activityPanel.classList.add(
            "hidden"
        );

        selectedActivity =
            null;

    }
);


/* =========================================================
   CATEGORY FILTER
========================================================= */

document
    .querySelectorAll(
        ".filter-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter-btn"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );

                    renderActivities(
                        button.dataset.category
                    );

                }
            );

        }
    );


/* =========================================================
   INITIALIZE
========================================================= */

updateProgress();

renderActivities();


/* =========================================================
   SAVE BEFORE LEAVING
========================================================= */

window.addEventListener(
    "beforeunload",
    saveData
);