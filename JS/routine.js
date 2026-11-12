/* =========================================================
   MINDMIRROR - ROUTINE BUILDER
   ========================================================= */

import { auth } from "./firebase-config.js";


/* =========================================================
   TASK ELEMENTS
   ========================================================= */

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const completedCount = document.getElementById("completedCount");
const totalCount = document.getElementById("totalCount");
const progressPercentage = document.getElementById("progressPercentage");
const progressFill = document.getElementById("progressFill");
const inputError = document.getElementById("inputError");
const completionMessage = document.getElementById("completionMessage");
const motivationQuote = document.getElementById("motivationQuote");


/* =========================================================
   REMINDER ELEMENTS
   ========================================================= */

const reminderDate = document.getElementById("reminderDate");
const reminderTime = document.getElementById("reminderTime");
const reminderMessage = document.getElementById("reminderMessage");
const saveReminderBtn = document.getElementById("saveReminderBtn");
const clearReminderBtn = document.getElementById("clearReminderBtn");
const reminderSaveMessage = document.getElementById("reminderSaveMessage");
const reminderList = document.getElementById("reminderList");
const messageCharacterCount = document.getElementById("messageCharacterCount");
const reminderStatusDot = document.getElementById("reminderStatusDot");
const reminderStatusText = document.getElementById("reminderStatusText");

const reminderPopup = document.getElementById("reminderPopup");
const popupMessage = document.getElementById("popupMessage");
const closeReminderPopup = document.getElementById("closeReminderPopup");


/* =========================================================
   BACKEND API CONNECTION
   ========================================================= */

const API_BASE = "https://mindmirror-backend-b6zj.onrender.com/api";


/* =========================================================
   USER-SPECIFIC STORAGE KEYS
   ========================================================= */

function getStorageKeys() {

    const userId = auth.currentUser?.uid;

    if (!userId) {
        throw new Error("User is not logged in.");
    }

    return {
        tasks: `mindMirrorDailyRoutine_${userId}`,
        reminders: `mindMirrorRoutineReminder_${userId}`,
        reminderTriggers: `mindMirrorLastTriggeredReminder_${userId}`
    };

}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function waitForAuthUser() {

    if (typeof auth.authStateReady === "function") {
        await auth.authStateReady();
    }

    if (auth.currentUser) {
        return auth.currentUser;
    }

    let attempts = 0;

    while (!auth.currentUser && attempts < 100) {

        await new Promise(resolve => setTimeout(resolve, 100));

        attempts++;

    }

    if (!auth.currentUser) {
        throw new Error("Please log in to continue.");
    }

    return auth.currentUser;

}


/* =========================================================
   BACKEND REQUEST
   ========================================================= */

async function routineApiRequest(endpoint, method = "GET", data = null) {

    const user = await waitForAuthUser();

    const token = await user.getIdToken();

    const options = {
        method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };

    if (data !== null) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    let result;

    try {
        result = await response.json();
    } catch {
        result = {};
    }

    if (!response.ok) {
        throw new Error(result.message || "Backend request failed.");
    }

    return result;

}


/* =========================================================
   TASK DATA
   ========================================================= */

let tasks = [];
let routineId = null;
let currentUserId = null;

let routineInitialized = false;
let routineSyncInProgress = false;


/* =========================================================
   MOTIVATION QUOTES
   ========================================================= */

const motivationQuotes = [
    "Small steps every day lead to meaningful change.",
    "You don't have to do everything at once. Just take one step.",
    "Progress is progress, no matter how small.",
    "A better day can begin with one small action.",
    "Be patient with yourself. You are doing your best.",
    "Every completed task is a step forward.",
    "Consistency matters more than perfection.",
    "Take it one task, one moment, one day at a time.",
    "Believe in the small progress you make each day.",
    "You are building better habits, one step at a time."
];


/* =========================================================
   LOAD TASKS FROM LOCAL STORAGE
   ========================================================= */

function loadTasks() {

    try {

        const keys = getStorageKeys();

        const savedTasks = localStorage.getItem(keys.tasks);

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        return Array.isArray(parsedTasks) ? parsedTasks : [];

    } catch (error) {

        console.error("Unable to load routine tasks:", error);

        return [];

    }

}


/* =========================================================
   SAVE TASKS TO LOCAL STORAGE
   ========================================================= */

function saveTasks() {

    try {

        const keys = getStorageKeys();

        localStorage.setItem(
            keys.tasks,
            JSON.stringify(tasks)
        );

        return true;

    } catch (error) {

        console.error("Unable to save routine tasks:", error);

        return false;

    }

}


/* =========================================================
   LOAD TASKS FROM BACKEND
   ========================================================= */

async function loadTasksFromBackend() {

    try {

        const user = await waitForAuthUser();

        const result = await routineApiRequest(
            `/routine/${encodeURIComponent(user.uid)}`,
            "GET"
        );

        if (result.status && result.status !== "success") {
            throw new Error(result.message || "Unable to load routine.");
        }

        const routines = Array.isArray(result.routines)
            ? result.routines
            : [];

        const existingRoutine = routines.find(
            routine => routine.routine_name === "Today's Routine"
        );

        if (!existingRoutine) {

            routineId = null;

            // Keep this user's local tasks if no backend routine exists yet.
            tasks = loadTasks();

            renderTasks();

            return false;

        }

        routineId = existingRoutine.routine_id;

        const backendTasks = Array.isArray(existingRoutine.routine_tasks)
            ? existingRoutine.routine_tasks
            : [];

        tasks = backendTasks.map((task, index) => ({
            id: task.id || `${routineId}_${index}`,
            text: task.task || task.text || "",
            completed: Boolean(task.completed)
        }));

        saveTasks();

        renderTasks();

        return true;

    } catch (error) {

        console.error("Unable to load routine from backend:", error);

        // Use this user's local data if the backend is unavailable.
        tasks = loadTasks();

        renderTasks();

        return false;

    }

}


/* =========================================================
   SYNC TASKS TO BACKEND
   ========================================================= */

async function syncTasksToBackend() {

    if (routineSyncInProgress) {
        return;
    }

    routineSyncInProgress = true;

    try {

        const user = await waitForAuthUser();

        // Do not sync data belonging to another logged-in account.
        if (currentUserId && currentUserId !== user.uid) {
            throw new Error("User changed. Please reload the routine.");
        }

        const routineTasks = tasks.map(task => ({
            task: task.text,
            completed: Boolean(task.completed)
        }));

        // Find the user's existing routine if routineId is unavailable.
        if (!routineId) {

            const result = await routineApiRequest(
                `/routine/${encodeURIComponent(user.uid)}`,
                "GET"
            );

            const routines = Array.isArray(result.routines)
                ? result.routines
                : [];

            const existingRoutine = routines.find(
                routine => routine.routine_name === "Today's Routine"
            );

            if (existingRoutine) {
                routineId = existingRoutine.routine_id;
            }

        }

        // Update existing routine.
        if (routineId) {

            await routineApiRequest(
                `/routine/${encodeURIComponent(routineId)}`,
                "PUT",
                {
                    routine_name: "Today's Routine",
                    routine_tasks: routineTasks
                }
            );

        } else {

            // Create routine if this user does not have one.
            const createResult = await routineApiRequest(
                "/routine",
                "POST",
                {
                    routine_name: "Today's Routine",
                    routine_tasks: routineTasks
                }
            );

            if (createResult.routine_id) {
                routineId = createResult.routine_id;
            } else {

                // Retrieve the created routine ID.
                const result = await routineApiRequest(
                    `/routine/${encodeURIComponent(user.uid)}`,
                    "GET"
                );

                const routines = Array.isArray(result.routines)
                    ? result.routines
                    : [];

                const savedRoutine = routines.find(
                    routine => routine.routine_name === "Today's Routine"
                );

                if (savedRoutine) {
                    routineId = savedRoutine.routine_id;
                }

            }

        }

    } catch (error) {

        console.error("Routine sync failed:", error);

    } finally {

        routineSyncInProgress = false;

    }

}


/* =========================================================
   ADD TASK
   ========================================================= */

async function addTask() {

    if (!routineInitialized) {
        inputError.textContent = "Please wait while your routine loads.";
        return;
    }

    const taskText = taskInput.value.trim();

    inputError.textContent = "";

    if (!taskText) {

        inputError.textContent = "Please enter a task.";

        taskInput.focus();

        return;

    }

    if (taskText.length > 100) {

        inputError.textContent =
            "Task should be less than 100 characters.";

        return;

    }

    const newTask = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        text: taskText,
        completed: false
    };

    tasks.push(newTask);

    saveTasks();

    renderTasks();

    taskInput.value = "";

    taskInput.focus();

    await syncTasksToBackend();

}


/* =========================================================
   DELETE TASK
   ========================================================= */

async function deleteTask(taskId) {

    if (!routineInitialized) {
        return;
    }

    tasks = tasks.filter(
        task => String(task.id) !== String(taskId)
    );

    saveTasks();

    renderTasks();

    await syncTasksToBackend();

}


/* =========================================================
   TOGGLE TASK
   ========================================================= */

async function toggleTask(taskId) {

    if (!routineInitialized) {
        return;
    }

    tasks = tasks.map(task => {

        if (String(task.id) === String(taskId)) {

            return {
                ...task,
                completed: !task.completed
            };

        }

        return task;

    });

    saveTasks();

    renderTasks();

    await syncTasksToBackend();

}


/* =========================================================
   RENDER TASKS
   ========================================================= */

function renderTasks() {

    if (!taskList || !emptyState) {
        return;
    }

    taskList.innerHTML = "";

    emptyState.style.display =
        tasks.length === 0 ? "block" : "none";

    tasks.forEach(task => {

        const taskItem = document.createElement("div");

        taskItem.className = "task-item";

        if (task.completed) {
            taskItem.classList.add("completed");
        }

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className = "task-checkbox";

        checkbox.checked = Boolean(task.completed);

        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.text} as completed`
        );

        checkbox.addEventListener("change", function () {
            toggleTask(task.id);
        });

        const taskText = document.createElement("span");

        taskText.className = "task-text";

        taskText.textContent = task.text;

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className = "delete-task";

        deleteButton.textContent = "🗑";

        deleteButton.title = "Delete task";

        deleteButton.addEventListener("click", function () {
            deleteTask(task.id);
        });

        taskItem.appendChild(checkbox);

        taskItem.appendChild(taskText);

        taskItem.appendChild(deleteButton);

        taskList.appendChild(taskItem);

    });

    updateProgress();

}


/* =========================================================
   UPDATE PROGRESS
   ========================================================= */

function updateProgress() {

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    if (totalCount) {
        totalCount.textContent = total;
    }

    if (completedCount) {
        completedCount.textContent = completed;
    }

    let percentage = 0;

    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }

    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (completionMessage) {

        if (total > 0 && completed === total) {
            completionMessage.classList.remove("hidden");
        } else {
            completionMessage.classList.add("hidden");
        }

    }

}


/* =========================================================
   UPDATE MOTIVATION QUOTE
   ========================================================= */

function updateMotivationQuote() {

    if (!motivationQuote) {
        return;
    }

    const randomIndex = Math.floor(
        Math.random() * motivationQuotes.length
    );

    motivationQuote.textContent =
        motivationQuotes[randomIndex];

}


/* =========================================================
   REMINDER STORAGE
   ========================================================= */

function loadReminders() {

    try {

        const keys = getStorageKeys();

        const savedReminders = localStorage.getItem(keys.reminders);

        if (!savedReminders) {
            return [];
        }

        const parsedReminders = JSON.parse(savedReminders);

        if (Array.isArray(parsedReminders)) {
            return parsedReminders;
        }

        // Convert legacy single-reminder format.
        if (
            parsedReminders &&
            typeof parsedReminders === "object" &&
            parsedReminders.notification_date
        ) {

            const convertedReminder = {
                ...parsedReminders,
                id: parsedReminders.id || Date.now()
            };

            saveReminders([convertedReminder]);

            return [convertedReminder];

        }

        return [];

    } catch (error) {

        console.error("Unable to load reminders:", error);

        return [];

    }

}


/* =========================================================
   SAVE REMINDERS TO LOCAL STORAGE
   ========================================================= */

function saveReminders(reminders) {

    try {

        const keys = getStorageKeys();

        localStorage.setItem(
            keys.reminders,
            JSON.stringify(reminders)
        );

        return true;

    } catch (error) {

        console.error("Unable to save reminders:", error);

        return false;

    }

}


/* =========================================================
   INITIALIZE REMINDERS
   ========================================================= */

async function initializeReminder() {

    renderReminders();

    if (reminderDate) {
        reminderDate.value = "";
    }

    if (reminderTime) {
        reminderTime.value = "";
    }

    if (reminderMessage) {
        reminderMessage.value = "";
    }

    updateCharacterCount();

    await loadRemindersFromBackend();

}


/* =========================================================
   GET REMINDER FORM DATA
   ========================================================= */

function getReminderFromForm() {

    return {
        notification_date: reminderDate.value,
        notification_time: reminderTime.value,
        message: reminderMessage.value.trim()
    };

}


/* =========================================================
   LOAD REMINDERS FROM BACKEND
   ========================================================= */

async function loadRemindersFromBackend() {

    try {

        const user = await waitForAuthUser();

        if (currentUserId && currentUserId !== user.uid) {
            return;
        }

        const result = await routineApiRequest(
            "/routine/notifications",
            "GET"
        );

        if (result.status && result.status !== "success") {
            throw new Error(result.message || "Unable to load reminders.");
        }

        const notifications = Array.isArray(result.notifications)
            ? result.notifications
            : [];

        const backendReminders = notifications.map(reminder => ({
            id: String(reminder.notification_id),
            notification_type: reminder.notification_type,
            notification_date: reminder.notification_date,
            notification_time: reminder.notification_time,
            message: reminder.message
        }));

        saveReminders(backendReminders);

        renderReminders();

        setReminderStatus(backendReminders.length > 0);

    } catch (error) {

        console.error(
            "Unable to load reminders from backend:",
            error
        );

        // Keep the current user's local reminders if backend is unavailable.
        renderReminders();

    }

}


/* =========================================================
   DISPLAY REMINDERS
   ========================================================= */

function renderReminders() {

    if (!reminderList) {
        return;
    }

    const reminders = loadReminders();

    reminderList.innerHTML = "";

    if (reminders.length === 0) {

        reminderList.innerHTML =
            "<p>No reminders added yet.</p>";

        setReminderStatus(false);

        return;

    }

    reminders.forEach(reminder => {

        const reminderItem = document.createElement("div");

        reminderItem.className = "saved-reminder-item";

        const details = document.createElement("div");

        details.className = "saved-reminder-details";

        const date = document.createElement("strong");

        date.textContent =
            formatDate(reminder.notification_date);

        const time = document.createElement("span");

        time.textContent =
            formatTime(reminder.notification_time);

        const message = document.createElement("p");

        message.textContent = reminder.message || "";

        details.appendChild(date);

        details.appendChild(time);

        details.appendChild(message);

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";

        deleteButton.textContent = "Delete";

        deleteButton.className = "delete-reminder-btn";

        deleteButton.addEventListener("click", function () {
            deleteReminder(String(reminder.id));
        });

        reminderItem.appendChild(details);

        reminderItem.appendChild(deleteButton);

        reminderList.appendChild(reminderItem);

    });

    setReminderStatus(true);

}


/* =========================================================
   SAVE REMINDER
   ========================================================= */

async function handleSaveReminder() {

    if (!routineInitialized) {
        reminderSaveMessage.textContent = "Please wait while your account loads.";
        return;
    }

    reminderSaveMessage.textContent = "";

    const reminder = getReminderFromForm();

    if (!reminder.notification_date) {

        reminderSaveMessage.textContent =
            "Please select a reminder date.";

        reminderSaveMessage.style.color = "#B85C5C";

        reminderDate.focus();

        return;

    }

    if (!reminder.notification_time) {

        reminderSaveMessage.textContent =
            "Please select a reminder time.";

        reminderSaveMessage.style.color = "#B85C5C";

        reminderTime.focus();

        return;

    }

    if (!reminder.message) {

        reminderSaveMessage.textContent =
            "Please enter a reminder message.";

        reminderSaveMessage.style.color = "#B85C5C";

        reminderMessage.focus();

        return;

    }

    try {

        const result = await routineApiRequest(
            "/routine/notification",
            "POST",
            {
                notification_type: "Routine",
                notification_date: reminder.notification_date,
                notification_time: reminder.notification_time,
                message: reminder.message
            }
        );

        console.log("Backend reminder response:", result);

        if (!result.notification_id) {
            throw new Error(
                "Reminder was saved, but the backend did not return its ID."
            );
        }

        const savedReminder = {
            id: String(result.notification_id),
            notification_type: "Routine",
            notification_date: reminder.notification_date,
            notification_time: reminder.notification_time,
            message: reminder.message
        };

        let reminders = loadReminders();

        reminders.push(savedReminder);

        if (!saveReminders(reminders)) {
            throw new Error("Unable to update local reminder storage.");
        }

        renderReminders();

        setReminderStatus(true);

        reminderSaveMessage.textContent =
            "Reminder saved successfully.";

        reminderSaveMessage.style.color = "#4F8A68";

        reminderDate.value = "";

        reminderTime.value = "";

        reminderMessage.value = "";

        updateCharacterCount();

    } catch (error) {

        console.error("Reminder save failed:", error);

        reminderSaveMessage.textContent =
            error.message || "Unable to save reminder.";

        reminderSaveMessage.style.color = "#B85C5C";

    }

}


/* =========================================================
   DELETE REMINDER
   ========================================================= */

async function deleteReminder(reminderId) {

    const confirmed = window.confirm(
        "Do you want to delete this reminder?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const result = await routineApiRequest(
            `/routine/notification/${encodeURIComponent(reminderId)}`,
            "DELETE"
        );

        if (result.status && result.status !== "success") {
            throw new Error(result.message || "Unable to delete reminder.");
        }

        let reminders = loadReminders();

        reminders = reminders.filter(
            reminder => String(reminder.id) !== String(reminderId)
        );

        saveReminders(reminders);

        renderReminders();

        setReminderStatus(reminders.length > 0);

        reminderSaveMessage.textContent =
            "Reminder deleted successfully.";

        reminderSaveMessage.style.color = "#4F8A68";

    } catch (error) {

        console.error("Reminder deletion failed:", error);

        reminderSaveMessage.textContent =
            error.message || "Unable to delete reminder.";

        reminderSaveMessage.style.color = "#B85C5C";

    }

}


/* =========================================================
   CLEAR ALL REMINDERS
   ========================================================= */

async function handleClearReminder() {

    if (!routineInitialized) {
        reminderSaveMessage.textContent = "Please wait while your account loads.";
        return;
    }

    const confirmed = window.confirm(
        "Do you want to clear all routine reminders?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const result = await routineApiRequest(
            "/routine/notifications",
            "GET"
        );

        if (result.status && result.status !== "success") {
            throw new Error("Unable to retrieve reminders.");
        }

        const notifications = Array.isArray(result.notifications)
            ? result.notifications
            : [];

        for (const reminder of notifications) {

            await routineApiRequest(
                `/routine/notification/${encodeURIComponent(reminder.notification_id)}`,
                "DELETE"
            );

        }

        saveReminders([]);

        const keys = getStorageKeys();

        localStorage.removeItem(keys.reminderTriggers);

        reminderDate.value = "";

        reminderTime.value = "";

        reminderMessage.value = "";

        renderReminders();

        setReminderStatus(false);

        updateCharacterCount();

        reminderSaveMessage.textContent =
            "All reminders cleared.";

        reminderSaveMessage.style.color = "#4F8A68";

    } catch (error) {

        console.error("Clear reminders failed:", error);

        reminderSaveMessage.textContent =
            error.message || "Unable to clear reminders.";

        reminderSaveMessage.style.color = "#B85C5C";

    }

}


/* =========================================================
   REMINDER STATUS
   ========================================================= */

function setReminderStatus(active) {

    if (!reminderStatusDot || !reminderStatusText) {
        return;
    }

    if (active) {

        reminderStatusDot.classList.add("active");

        reminderStatusText.textContent = "Reminder set";

    } else {

        reminderStatusDot.classList.remove("active");

        reminderStatusText.textContent = "Not set";

    }

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

}


/* =========================================================
   TIME FORMAT
   ========================================================= */

function formatTime(timeString) {

    if (!timeString) {
        return "—";
    }

    const parts = timeString.split(":");

    if (parts.length < 2) {
        return timeString;
    }

    let hours = parseInt(parts[0], 10);

    const minutes = parts[1];

    if (Number.isNaN(hours)) {
        return timeString;
    }

    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;

}


/* =========================================================
   CHARACTER COUNT
   ========================================================= */

function updateCharacterCount() {

    if (!reminderMessage || !messageCharacterCount) {
        return;
    }

    messageCharacterCount.textContent =
        reminderMessage.value.length;

}


/* =========================================================
   CHECK REMINDERS
   ========================================================= */

function checkReminder() {

    if (!routineInitialized || !currentUserId) {
        return;
    }

    const reminders = loadReminders();

    if (reminders.length === 0) {
        return;
    }

    const now = new Date();

    let triggeredReminders = [];

    try {

        const keys = getStorageKeys();

        const savedTriggers =
            localStorage.getItem(keys.reminderTriggers);

        const parsedTriggers =
            JSON.parse(savedTriggers || "[]");

        if (Array.isArray(parsedTriggers)) {
            triggeredReminders = parsedTriggers;
        }

    } catch (error) {

        try {

            const keys = getStorageKeys();

            localStorage.removeItem(keys.reminderTriggers);

        } catch (storageError) {

            console.error(storageError);

        }

    }

    reminders.forEach(reminder => {

        if (
            !reminder.notification_date ||
            !reminder.notification_time
        ) {
            return;
        }

        const reminderDateTime = new Date(
            `${reminder.notification_date}T${reminder.notification_time}:00`
        );

        if (Number.isNaN(reminderDateTime.getTime())) {
            return;
        }

        const difference =
            now.getTime() - reminderDateTime.getTime();

        const triggerWindow = 60 * 1000;

        const triggerKey = `reminder_${reminder.id}`;

        if (
            difference >= 0 &&
            difference <= triggerWindow &&
            !triggeredReminders.includes(triggerKey)
        ) {

            showReminderPopup(reminder.message);

            triggeredReminders.push(triggerKey);

            try {

                const keys = getStorageKeys();

                localStorage.setItem(
                    keys.reminderTriggers,
                    JSON.stringify(triggeredReminders)
                );

            } catch (error) {

                console.error("Unable to save reminder trigger:", error);

            }

        }

    });

}


/* =========================================================
   SHOW REMINDER POPUP
   ========================================================= */

function showReminderPopup(message) {

    showBrowserNotification(message);

}


/* =========================================================
   BROWSER NOTIFICATION
   ========================================================= */

  
async function showBrowserNotification(message) {

    if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator)
    ) {
        return;
    }

    if (Notification.permission !== "granted") {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register(
            "./sw.js",
            { scope: "./" }
        );

        await registration.showNotification(
            "MindMirror - Routine Reminder",
            {
                body: message,
                icon: new URL(
                    "./Images/logo.png",
                    window.location.href
                ).href,
                badge: new URL(
                    "./Images/logo.png",
                    window.location.href
                ).href,
                tag: "mindmirror-routine-reminder"
            }
        );

    } catch (error) {
        console.error("Routine notification error:", error);
    }

}


/* =========================================================
   NOTIFICATION PERMISSION
   ========================================================= */

async function requestNotificationPermission() {

    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission === "default") {

        try {

            await Notification.requestPermission();

        } catch (error) {

            console.error(
                "Notification permission error:",
                error
            );

        }

    }

}


/* =========================================================
   INITIALIZE ROUTINE PAGE AFTER LOGIN
   ========================================================= */

async function initializeRoutinePage() {

    try {

        const user = await waitForAuthUser();

        currentUserId = user.uid;

        routineId = null;

        tasks = loadTasks();

        renderTasks();

        updateMotivationQuote();

        // Load the authenticated user's tasks.
        await loadTasksFromBackend();

        // Load reminders for the authenticated user.
        await initializeReminder();

        routineInitialized = true;

        checkReminder();

    } catch (error) {

        console.error("Routine initialization failed:", error);

        if (inputError) {
            inputError.textContent =
                "Unable to load your routine. Please log in again.";
        }

        if (reminderSaveMessage) {
            reminderSaveMessage.textContent =
                "Unable to load reminders. Please log in again.";
        }

    }

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

addTaskBtn.addEventListener("click", addTask);


taskInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        event.preventDefault();

        addTask();

    }

});


taskInput.addEventListener("input", function () {

    inputError.textContent = "";

});


saveReminderBtn.addEventListener("click", function () {

    handleSaveReminder();

    requestNotificationPermission();

});


clearReminderBtn.addEventListener(
    "click",
    handleClearReminder
);


reminderMessage.addEventListener("input", function () {

    updateCharacterCount();

    reminderSaveMessage.textContent = "";

});


reminderDate.addEventListener("change", function () {

    reminderSaveMessage.textContent = "";

});


reminderTime.addEventListener("change", function () {

    reminderSaveMessage.textContent = "";

});


closeReminderPopup.addEventListener("click", function () {

    reminderPopup.classList.add("hidden");

});


/* =========================================================
   REMINDER TIMER
   ========================================================= */

setInterval(checkReminder, 30 * 1000);


document.addEventListener("visibilitychange", function () {

    if (document.visibilityState === "visible") {
        checkReminder();
    }

});


/* =========================================================
   FRONTEND API HOOK
   ========================================================= */

function getRoutineReminderPayload() {

    return loadReminders();

}


/* =========================================================
   START PAGE
   ========================================================= */

initializeRoutinePage();


/* =========================================================
   HANDLE ACCOUNT CHANGES
   ========================================================= */

auth.onAuthStateChanged(async user => {

    if (!user) {

        routineInitialized = false;

        currentUserId = null;

        routineId = null;

        tasks = [];

        renderTasks();

        renderReminders();

        return;

    }

    // Do not reload the same account unnecessarily.
    if (currentUserId === user.uid && routineInitialized) {
        return;
    }

    routineInitialized = false;

    currentUserId = user.uid;

    routineId = null;

    tasks = [];

    renderTasks();

    await initializeRoutinePage();

});
