
import { auth } from "./firebase-config.js";

const API_BASE = "https://mindmirror-backend-b6zj.onrender.com/api";

const STORAGE_KEY = "mindMirrorLatestSleep";
const REMINDER_STORAGE_KEY = "mindMirrorSleepReminder";
const REMINDER_TRIGGER_KEY = "mindMirrorSleepReminderTriggered";

const DEFAULT_REMINDER = {
    notification_type: "Bedtime Reminder",
    notification_date: "",
    notification_time: "22:00",
    message: "It's time to start your bedtime routine."
};

const sleepHoursInput = document.getElementById("sleepHours");
const qualityButtons = document.querySelectorAll(".quality-option");
const saveSleepButton = document.getElementById("saveSleepButton");
const sleepMessage = document.getElementById("sleepMessage");
const summaryHours = document.getElementById("summaryHours");
const summaryQuality = document.getElementById("summaryQuality");
const sleepInsightTitle = document.getElementById("sleepInsightTitle");
const sleepInsightText = document.getElementById("sleepInsightText");

const reminderType = document.getElementById("reminderType");
const reminderDate = document.getElementById("reminderDate");
const reminderTime = document.getElementById("reminderTime");
const reminderMessage = document.getElementById("reminderMessage");
const saveReminderButton = document.getElementById("saveReminderButton");
const cancelReminderButton = document.getElementById("cancelReminderButton");
const reminderMessageStatus = document.getElementById("reminderMessageStatus");
const savedReminder = document.getElementById("savedReminder");
const savedReminderTitle = document.getElementById("savedReminderTitle");
const savedReminderDate = document.getElementById("savedReminderDate");
const savedReminderText = document.getElementById("savedReminderText");

let selectedQuality = "";
let currentReminderId = null;

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register(
                "/sw.js"
            );

            console.log("Service Worker registered successfully:", registration);
        } catch (error) {
            console.error("Service Worker registration failed:", error);
        }
    });
}

/* ---------- AUTHENTICATED API HELPER ---------- */

async function apiRequest(path, options = {}) {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please log in to use Sleep Companion.");
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

    let data = {};

    try {
        data = await response.json();
    } catch {
        // The server may return an empty response.
    }

    if (!response.ok || data.status === "error") {
        throw new Error(
            data.message || data.error || `Request failed (${response.status})`
        );
    }

    return data;
}

/* ---------- MESSAGES ---------- */

function showSleepMessage(text, type) {
    sleepMessage.textContent = text;
    sleepMessage.className = "message " + type;
}

function clearSleepMessage() {
    sleepMessage.textContent = "";
    sleepMessage.className = "message";
}

function showReminderMessage(text, type) {
    reminderMessageStatus.textContent = text;
    reminderMessageStatus.className = "message " + type;
}

/* ---------- SLEEP QUALITY ---------- */

qualityButtons.forEach(button => {
    button.addEventListener("click", () => {
        qualityButtons.forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
        selectedQuality = button.dataset.quality;
        clearSleepMessage();
    });
});

/* ---------- SLEEP SUMMARY AND INSIGHT ---------- */

function updateSummary(record) {
    summaryHours.textContent = Number(record.sleep_hours).toFixed(1);
    summaryQuality.textContent = record.sleep_quality || "Not recorded";
}

function updateInsight(hours, quality) {
    let title = "Keep taking care of your sleep.";
    let message =
        "Small, consistent sleep habits can support your overall wellbeing.";

    if (hours < 5) {
        title = "Your body may need more rest.";
        message =
            "If possible, give yourself extra time to rest and create a calm bedtime routine.";
    } else if (hours < 7) {
        title = "A little more rest may help.";
        message =
            "Consider additional sleep when possible and keep your bedtime routine consistent.";
    } else if (hours <= 9) {
        title = "You gave yourself a good amount of rest.";
        message =
            "Maintaining a consistent sleep schedule can support your wellbeing.";
    } else {
        title = "You had a longer sleep period.";
        message =
            "Notice how you feel during the day and try to keep your sleep schedule comfortable.";
    }

    if (quality === "Poor") {
        title = "Your sleep quality could use some care.";
        message =
            "Try a calm wind-down routine, reduce distractions and create a peaceful space to rest.";
    } else if (quality === "Excellent") {
        title = "That sounds like restful sleep.";
        message = "Keep the habits that helped you feel comfortable and rested.";
    }

    sleepInsightTitle.textContent = title;
    sleepInsightText.textContent = message;
}

/* ---------- SAVE SLEEP RECORD TO FLASK ---------- */

saveSleepButton.addEventListener("click", saveSleepRecord);

async function saveSleepRecord() {
    const hours = Number(sleepHoursInput.value);

    if (
        sleepHoursInput.value.trim() === "" ||
        !Number.isFinite(hours) ||
        hours < 0 ||
        hours > 24
    ) {
        showSleepMessage(
            "Please enter a valid sleep duration between 0 and 24 hours.",
            "error"
        );
        sleepHoursInput.focus();
        return;
    }

    if (!selectedQuality) {
        showSleepMessage("Please select your sleep quality.", "error");
        return;
    }

    saveSleepButton.disabled = true;
    showSleepMessage("Saving your sleep record...", "success");

    try {
        const data = await apiRequest("/sleep", {
            method: "POST",
            body: JSON.stringify({
                sleep_hours: hours,
                sleep_quality: selectedQuality
            })
        });

        const record = {
            sleep_hours: hours,
            sleep_quality: selectedQuality,
            saved_at: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        updateSummary(record);
        updateInsight(hours, selectedQuality);

        showSleepMessage(
            data.message || "Your sleep record was saved successfully!",
            "success"
        );
    } catch (error) {
        showSleepMessage(error.message, "error");
    } finally {
        saveSleepButton.disabled = false;
    }
}

/* ---------- LOAD SLEEP HISTORY FROM FLASK ---------- */

async function loadLatestSleep() {
    try {
        const user = auth.currentUser;

        if (!user) return;

        const data = await apiRequest(
            `/sleep/${encodeURIComponent(user.uid)}`
        );

        const records = Array.isArray(data.records) ? data.records : [];

        if (records.length === 0) return;

        // Use the most recent record if the API returns timestamps.
        records.sort((a, b) => {
            const dateA = new Date(
                a.saved_at || a.created_at || a.timestamp || 0
            ).getTime();

            const dateB = new Date(
                b.saved_at || b.created_at || b.timestamp || 0
            ).getTime();

            return dateB - dateA;
        });

        const record = records[0];

        if (record.sleep_hours == null || !record.sleep_quality) return;

        sleepHoursInput.value = record.sleep_hours;
        selectedQuality = record.sleep_quality;

        qualityButtons.forEach(button => {
            button.classList.toggle(
                "selected",
                button.dataset.quality === selectedQuality
            );
        });

        updateSummary(record);
        updateInsight(Number(record.sleep_hours), record.sleep_quality);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (error) {
        console.error("Unable to load sleep history:", error);
    }
}

/* ---------- DEFAULT REMINDER ---------- */

function setDefaultReminder() {
    reminderType.value = DEFAULT_REMINDER.notification_type;

    // Set a default date of tomorrow, avoiding a stale hardcoded date.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");

    reminderDate.value = `${year}-${month}-${day}`;
    reminderTime.value = DEFAULT_REMINDER.notification_time;
    reminderMessage.value = DEFAULT_REMINDER.message;
}

/* ---------- REMINDER DISPLAY ---------- */

function formatReminderDateTime(date, time) {
    const dateObject = new Date(`${date}T${time}`);

    if (Number.isNaN(dateObject.getTime())) {
        return `${date} at ${time}`;
    }

    return dateObject.toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function displaySavedReminder(reminder) {
    savedReminderTitle.textContent =
        reminder.notification_type || "Sleep Reminder";

    savedReminderDate.textContent = formatReminderDateTime(
        reminder.notification_date,
        reminder.notification_time
    );

    savedReminderText.textContent = reminder.message || "";

    savedReminder.classList.remove("hidden");
}

/* ---------- SAVE OR UPDATE REMINDER ---------- */

saveReminderButton.addEventListener("click", saveSleepReminder);

async function saveSleepReminder() {
    const type = reminderType.value.trim();
    const date = reminderDate.value;
    const time = reminderTime.value;
    const message = reminderMessage.value.trim();

    if (!date) {
        showReminderMessage("Please select a reminder date.", "error");
        reminderDate.focus();
        return;
    }

    if (!time) {
        showReminderMessage("Please select a reminder time.", "error");
        reminderTime.focus();
        return;
    }

    if (!message) {
        showReminderMessage("Please enter a reminder message.", "error");
        reminderMessage.focus();
        return;
    }

    const scheduledTime = new Date(`${date}T${time}`);

    if (
        Number.isNaN(scheduledTime.getTime()) ||
        scheduledTime.getTime() <= Date.now()
    ) {
        showReminderMessage(
            "Please select a valid future date and time.",
            "error"
        );
        return;
    }

    const reminder = {
        notification_type: type || "Bedtime Reminder",
        notification_date: date,
        notification_time: time,
        message
    };

    saveReminderButton.disabled = true;
    showReminderMessage("Saving your reminder...", "success");

    try {
        let data;

        if (currentReminderId) {
            data = await apiRequest(
                `/sleep/notification/${encodeURIComponent(currentReminderId)}`,
                {
                    method: "PUT",
                    body: JSON.stringify(reminder)
                }
            );
        } else {
            data = await apiRequest("/sleep/notification", {
                method: "POST",
                body: JSON.stringify(reminder)
            });
        }

        // Save the ID returned by the backend so later edits/cancellation
        // target the same Firestore record.
        if (data.notification_id) {
            currentReminderId = data.notification_id;
        }

        reminder.notification_id = currentReminderId;
        reminder.created_at = new Date().toISOString();

        localStorage.setItem(
            REMINDER_STORAGE_KEY,
            JSON.stringify(reminder)
        );

        localStorage.removeItem(REMINDER_TRIGGER_KEY);
        displaySavedReminder(reminder);
        requestNotificationPermission();

        showReminderMessage(
            data.message || "Your sleep reminder has been saved successfully!",
            "success"
        );
    } catch (error) {
        showReminderMessage(error.message, "error");
    } finally {
        saveReminderButton.disabled = false;
    }
}

/* ---------- LOAD REMINDERS FROM FLASK ---------- */

async function loadSavedReminder() {
    setDefaultReminder();

    try {
        const data = await apiRequest("/sleep/notifications");
        const notifications = Array.isArray(data.notifications)
            ? data.notifications
            : [];

        const futureReminders = notifications
            .filter(item => item.notification_date && item.notification_time)
            .filter(item => {
                const scheduled = new Date(
                    `${item.notification_date}T${item.notification_time}`
                );
                return !Number.isNaN(scheduled.getTime()) &&
                    scheduled.getTime() > Date.now();
            })
            .sort((a, b) => {
                return new Date(
                    `${a.notification_date}T${a.notification_time}`
                ) - new Date(
                    `${b.notification_date}T${b.notification_time}`
                );
            });

        if (futureReminders.length === 0) {
            currentReminderId = null;
            localStorage.removeItem(REMINDER_STORAGE_KEY);
            savedReminder.classList.add("hidden");
            return;
        }

        const reminder = futureReminders[0];

        currentReminderId =
            reminder.notification_id || reminder.id || null;

        reminder.notification_id = currentReminderId;

        reminderType.value =
            reminder.notification_type || DEFAULT_REMINDER.notification_type;
        reminderDate.value =
            reminder.notification_date;
        reminderTime.value =
            reminder.notification_time;
        reminderMessage.value =
            reminder.message || DEFAULT_REMINDER.message;

        localStorage.setItem(
            REMINDER_STORAGE_KEY,
            JSON.stringify(reminder)
        );

        displaySavedReminder(reminder);
    } catch (error) {
        // Preserve the local reminder if the backend cannot be reached.
        console.error("Unable to load reminders from backend:", error);

        const saved = localStorage.getItem(REMINDER_STORAGE_KEY);

        if (saved) {
            try {
                const reminder = JSON.parse(saved);

                currentReminderId = reminder.notification_id || null;
                reminderType.value = reminder.notification_type || "";
                reminderDate.value = reminder.notification_date || "";
                reminderTime.value = reminder.notification_time || "";
                reminderMessage.value = reminder.message || "";

                displaySavedReminder(reminder);
            } catch {
                setDefaultReminder();
            }
        }
    }
}

/* ---------- CANCEL REMINDER ---------- */

cancelReminderButton.addEventListener("click", cancelSleepReminder);

async function cancelSleepReminder() {
    cancelReminderButton.disabled = true;

    try {
        if (currentReminderId) {
            const data = await apiRequest(
                `/sleep/notification/${encodeURIComponent(currentReminderId)}`,
                { method: "DELETE" }
            );

            showReminderMessage(
                data.message || "Your sleep reminder has been cancelled.",
                "success"
            );
        } else {
            showReminderMessage(
                "No saved backend reminder was selected.",
                "error"
            );
            return;
        }

        localStorage.removeItem(REMINDER_STORAGE_KEY);
        localStorage.removeItem(REMINDER_TRIGGER_KEY);

        currentReminderId = null;
        savedReminder.classList.add("hidden");
        setDefaultReminder();
    } catch (error) {
        showReminderMessage(error.message, "error");
    } finally {
        cancelReminderButton.disabled = false;
    }
}

/* ---------- BROWSER NOTIFICATIONS ---------- */

function requestNotificationPermission() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
        Notification.requestPermission().catch(error => {
            console.error("Notification permission error:", error);
        });
    }
}

function showSleepNotification(reminder) {
    const title = reminder.notification_type || "Sleep Reminder";
    const message =
        reminder.message || "It's time to start your bedtime routine.";

    showReminderMessage(`${title}: ${message}`, "success");
    savedReminder.classList.add("reminder-triggered");

    setTimeout(() => {
        savedReminder.classList.remove("reminder-triggered");
    }, 5000);
}

function checkSleepReminder() {
    const saved = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!saved) return;

    try {
        const reminder = JSON.parse(saved);
        const scheduled = new Date(
            `${reminder.notification_date}T${reminder.notification_time}`
        );

        if (Number.isNaN(scheduled.getTime())) return;

        const difference = Date.now() - scheduled.getTime();

        if (difference >= 0 && difference < 60000) {
            const identifier =
                `${reminder.notification_date}_${reminder.notification_time}_${reminder.message}`;

            if (localStorage.getItem(REMINDER_TRIGGER_KEY) !== identifier) {
                showSleepNotification(reminder);
                localStorage.setItem(REMINDER_TRIGGER_KEY, identifier);
            }
        }
    } catch (error) {
        console.error("Unable to check sleep reminder:", error);
    }
}

/* ---------- CLEAR VALIDATION MESSAGES ---------- */

sleepHoursInput.addEventListener("input", clearSleepMessage);

[reminderDate, reminderTime, reminderMessage].forEach(element => {
    element.addEventListener("input", () => {
        reminderMessageStatus.textContent = "";
        reminderMessageStatus.className = "message";
    });
});

/* ---------- INITIALIZE AFTER FIREBASE AUTH ---------- */

auth.onAuthStateChanged(async user => {
    if (!user) {
        showSleepMessage("Please log in to save your sleep records.", "error");
        setDefaultReminder();
        return;
    }

    await Promise.all([
        loadLatestSleep(),
        loadSavedReminder()
    ]);

    checkSleepReminder();
});

setInterval(checkSleepReminder, 5000);

const VAPID_PUBLIC_KEY = "BCczlQ-IYhzA4R17AcKCoTKwBRM39K7p79YJ7Fe6dp-ZIFbYNliySBKzn0dW1Eh8nwsc2SvlTMNygAlbLx4iMpo";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = atob(base64);
    return Uint8Array.from(rawData, char => char.charCodeAt(0));
}


document.getElementById("enablePushButton").addEventListener("click", async () => {
    try {
        const user = auth.currentUser;

        if (!user) {
            alert("Please log in before enabling notifications.");
            return;
        }

        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            alert("Your browser does not support push notifications.");
            return;
        }

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            alert("Please allow notifications in Edge.");
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE}/push/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(subscription.toJSON())
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not save subscription.");
        }

        console.log("Push subscription saved successfully.");
        alert("Sleep notifications enabled successfully!");

    } catch (error) {
        console.error("Push subscription failed:", error);
        alert("Could not enable notifications. Check the Console.");
    }
});