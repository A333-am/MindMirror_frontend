/* =========================================
   MINDMIRROR SELF-CARE
   ========================================= */
   import { auth } from "./firebase-config.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
function getFirebaseToken() {

    return new Promise((resolve, reject) => {

        const unsubscribe = onAuthStateChanged(auth, async (user) => {

            unsubscribe();

            if (!user) {
                reject(new Error("Please login first."));
                return;
            }

            try {
                const token = await user.getIdToken();
                resolve(token);
            } catch (error) {
                reject(error);
            }

        });

    });

}
   document.addEventListener("DOMContentLoaded", function () {

    /* =====================================
       ELEMENTS
       ===================================== */

    const dashboardBtn =
        document.getElementById("dashboardBtn");

    const selfCareForm =
        document.getElementById("selfCareForm");

    const selfCareType =
        document.getElementById("selfCareType");

    const reminderDate =
        document.getElementById("reminderDate");

    const reminderTime =
        document.getElementById("reminderTime");

    const reminderMessage =
        document.getElementById("reminderMessage");

    const reminderList =
        document.getElementById("reminderList");

    const notificationBtn =
        document.getElementById("notificationBtn");

    const notificationStatus =
        document.getElementById("notificationStatus");

    const dailyMessage =
        document.getElementById("dailyMessage");

    const toast =
        document.getElementById("toast");


    /* =====================================
       STORAGE
       ===================================== */

    const STORAGE_KEY =
        "mindmirrorSelfCareReminders";


    /* =====================================
       ICONS
       ===================================== */

    const typeIcons = {
        Mental: "🧠",
        Physical: "🏃",
        Emotional: "💗",
        Social: "👥",
        Personal: "✨"
    };


    /* =====================================
       SUPPORTIVE MESSAGES
       ===================================== */

    const supportiveMessages = [

        "Be kind to yourself. You're doing the best you can.",

        "You deserve rest, care, and kindness.",

        "Small steps still count.",

        "Take a little time to care for yourself today.",

        "Your feelings matter.",

        "It's okay to slow down and breathe.",

        "You don't have to do everything at once.",

        "Give yourself the same kindness you give others.",

        "Today is another chance to take care of yourself."

    ];


    /* =====================================
       DEFAULT DATE
       ===================================== */

    function setDefaultDate() {

        const today = new Date();

        const year =
            today.getFullYear();

        const month =
            String(today.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(today.getDate())
                .padStart(2, "0");

        reminderDate.value =
            `${year}-${month}-${day}`;
    }


    /* =====================================
       DAILY MESSAGE
       ===================================== */

    function showDailyMessage() {

        const today =
            new Date();

        const index =
            today.getDate() %
            supportiveMessages.length;

        dailyMessage.textContent =
            supportiveMessages[index];
    }


    /* =====================================
       GET REMINDERS
       ===================================== */

    function getReminders() {

        try {

            const saved =
                localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return [];
            }

            const reminders =
                JSON.parse(saved);

            return Array.isArray(reminders)
                ? reminders
                : [];

        } catch (error) {

            console.error(
                "Unable to load reminders:",
                error
            );

            return [];
        }
    }


    /* =====================================
       SAVE REMINDERS
       ===================================== */

    function saveReminders(reminders) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(reminders)
        );
    }


    /* =====================================
       FORMAT DATE
       ===================================== */

    function formatDate(dateString) {

        if (!dateString) {
            return "";
        }

        const parts =
            dateString.split("-");

        if (parts.length !== 3) {
            return dateString;
        }

        const date =
            new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            );

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }


    /* =====================================
       FORMAT TIME
       ===================================== */

    function formatTime(timeString) {

        if (!timeString) {
            return "";
        }

        const parts =
            timeString.split(":");

        let hours =
            Number(parts[0]);

        const minutes =
            parts[1];

        const period =
            hours >= 12 ? "PM" : "AM";

        hours =
            hours % 12 || 12;

        return `${hours}:${minutes} ${period}`;
    }


    /* =====================================
       TOAST
       ===================================== */

    let toastTimer;


    function showToast(message) {

        toast.textContent =
            message;

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer =
            setTimeout(function () {

                toast.classList.remove("show");

            }, 2500);
    }


    /* =====================================
       RENDER
       ===================================== */

    function renderReminders() {

        const reminders =
            getReminders();

        reminderList.innerHTML = "";


        if (reminders.length === 0) {

            const empty =
                document.createElement("div");

            empty.className =
                "empty-state";

            empty.textContent =
                "No self-care reminders yet. Add one small act of care for yourself.";

            reminderList.appendChild(empty);

            return;
        }


        reminders
            .slice()
            .reverse()
            .forEach(function (reminder) {

                const item =
                    document.createElement("div");

                item.className =
                    "reminder-item";


                if (reminder.completed) {

                    item.classList.add(
                        "completed"
                    );

                }


                /* ICON */

                const icon =
                    document.createElement("div");

                icon.className =
                    "reminder-type-icon";

                icon.textContent =
                    typeIcons[reminder.type] ||
                    "🌱";


                /* DETAILS */

                const details =
                    document.createElement("div");

                details.className =
                    "reminder-details";


                const type =
                    document.createElement("div");

                type.className =
                    "reminder-type";

                type.textContent = (reminder.type || "Personal").toUpperCase();

                const message =
                    document.createElement("div");

                message.className =
                    "reminder-message";

                message.textContent =
                    reminder.message;


                const dateTime =
                    document.createElement("div");

                dateTime.className =
                    "reminder-date-time";

                dateTime.textContent =
                    `${formatDate(reminder.date)} • ${formatTime(reminder.time)}`;


                details.appendChild(type);

                details.appendChild(message);

                details.appendChild(dateTime);


                /* ACTIONS */

                const actions =
                    document.createElement("div");

                actions.className =
                    "reminder-actions";


                /* DONE */

                const doneButton =
                    document.createElement("button");

                doneButton.type =
                    "button";

                doneButton.className =
                    "done-btn";

                doneButton.textContent =
                    reminder.completed
                        ? "Completed"
                        : "Done";


                doneButton.addEventListener(
                    "click",
                    function () {

                        toggleReminder(
                            reminder.id
                        );

                    }
                );


                /* DELETE */

                const deleteButton =
                    document.createElement("button");

                deleteButton.type =
                    "button";

                deleteButton.className =
                    "delete-btn";

                deleteButton.textContent =
                    "Delete";


                deleteButton.addEventListener(
                    "click",
                    function () {

                        deleteReminder(
                            reminder.id
                        );

                    }
                );


                actions.appendChild(doneButton);

                actions.appendChild(deleteButton);


                item.appendChild(icon);

                item.appendChild(details);

                item.appendChild(actions);


                reminderList.appendChild(item);

            });
    }


    /* =====================================
       ADD REMINDER
       ===================================== */


       function convertToBackendTime(time) {

    const [hourStr, minute] = time.split(":");

    let hour = Number(hourStr);

    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
}

    async function addReminder() {

        const type =
            selfCareType.value.trim();

        const date =
            reminderDate.value;

        const time =
            reminderTime.value;

        const message =
            reminderMessage.value.trim();


        if (!type) {

            alert(
                "Please select a self-care type."
            );

            selfCareType.focus();

            return;
        }


        if (!date) {

            alert(
                "Please select a date."
            );

            reminderDate.focus();

            return;
        }


        if (!time) {

            alert(
                "Please select a time."
            );

            reminderTime.focus();

            return;
        }


        if (!message) {

            alert(
                "Please enter a reminder."
            );

            reminderMessage.focus();

            return;
        }


        const reminder = {

            id:
                Date.now().toString(),

            notification_type:
                "Self-Care Reminder",

            type:
                type,

            date:
                date,

            time:
                time,

            message:
                message,

            completed:
                false,

            created_at:
                new Date().toISOString()

        };


        try {

    const token = await getFirebaseToken();

    const response = await fetch(
        "https://mindmirror-backend-b6zj.onrender.com/api/reminder",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                reminder_text: reminder.message,
                reminder_date: reminder.date,
                reminder_time: convertToBackendTime(reminder.time)
            })
        }
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to save reminder.");
    }

    const reminders = getReminders();

    reminders.push(reminder);

    saveReminders(reminders);

} catch (error) {

    console.error("Reminder saving error:", error);

    alert("Could not save reminder to Firebase. Please try again.");

    return;
}



        renderReminders();


        selfCareForm.reset();

        setDefaultDate();


        showToast(
            "Self-care reminder added successfully."
        );


        checkSelfCareReminders();
    }


    /* =====================================
       COMPLETE
       ===================================== */

    function toggleReminder(id) {

        const reminders =
            getReminders();


        const reminder =
            reminders.find(function (item) {

                return item.id === id;

            });


        if (!reminder) {
            return;
        }


        reminder.completed =
            !reminder.completed;


        saveReminders(
            reminders
        );


        renderReminders();


        if (reminder.completed) {

            showToast(
                "Well done. You completed your self-care activity. 💜"
            );

        }
    }


    /* =====================================
       DELETE
       ===================================== */

    function deleteReminder(id) {

        if (
            !confirm(
                "Delete this self-care reminder?"
            )
        ) {
            return;
        }


        const reminders =
            getReminders();


        const updated =
            reminders.filter(function (item) {

                return item.id !== id;

            });


        saveReminders(
            updated
        );


        renderReminders();


        showToast(
            "Reminder deleted."
        );
    }


    /* =====================================
       NOTIFICATION UI
       ===================================== */

    function updateNotificationUI() {

        if (!("Notification" in window)) {

            notificationStatus.textContent =
                "Notifications are not supported by this browser.";

            notificationBtn.textContent =
                "Not Available";

            notificationBtn.disabled =
                true;

            return;
        }


        if (
            Notification.permission ===
            "granted"
        ) {

            notificationStatus.textContent =
                "Notifications are enabled.";

            notificationBtn.textContent =
                "Notifications Enabled";

            return;
        }


        if (
            Notification.permission ===
            "denied"
        ) {

            notificationStatus.textContent =
                "Notifications are blocked. Enable them from browser settings.";

            notificationBtn.textContent =
                "Notifications Blocked";

            return;
        }


        notificationStatus.textContent =
            "Enable notifications to receive your self-care reminder alerts.";

        notificationBtn.textContent =
            "Enable Notifications";
    }


    /* =====================================
       ENABLE NOTIFICATIONS
       ===================================== */

    
async function enableNotifications() {

    if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator)
    ) {
        alert("Your browser does not support notifications.");
        return;
    }

    try {
        await navigator.serviceWorker.register(
            "./sw.js",
            { scope: "./" }
        );

        const permission = await Notification.requestPermission();

        updateNotificationUI();

        if (permission === "granted") {

            const registration = await navigator.serviceWorker.ready;

            await registration.showNotification(
                "MindMirror 🌿",
                {
                    body: "Your self-care notifications are enabled.",
                    icon: new URL(
                        "./Images/logo.png",
                        window.location.href
                    ).href,
                    badge: new URL(
                        "./Images/logo.png",
                        window.location.href
                    ).href,
                    tag: "mindmirror-self-care-test",
                    data: {
                        url: new URL(
                            "./self-care.html",
                            window.location.href
                        ).href
                    }
                }
            );

            showToast("Notifications enabled successfully.");

        } else {
            showToast("Please allow notifications in your browser settings.");
        }

    } catch (error) {
        console.error("Self-care notification error:", error);
        showToast("Unable to enable notifications.");
    }
}



    /* =====================================
       SCHEDULE NOTIFICATION
       ===================================== */

    
const TRIGGERED_KEY = "mindmirrorSelfCareTriggered";

async function showSelfCareNotification(reminder) {

    try {

        if (
            !("Notification" in window) ||
            Notification.permission !== "granted"
        ) {
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(
            "MindMirror Self-Care 🌿",
            {
                body: reminder.message,
                icon: new URL(
                    "./Images/logo.png",
                    window.location.href
                ).href,
                badge: new URL(
                    "./Images/logo.png",
                    window.location.href
                ).href,
                tag: `mindmirror-self-care-${reminder.id}`,
                data: {
                    url: new URL(
                        "./self-care.html",
                        window.location.href
                    ).href
                }
            }
        );

    } catch (error) {
        console.error("Self-care notification display error:", error);
    }
}

function checkSelfCareReminders() {

    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }

    const reminders = getReminders();

    let triggered = [];

    try {
        triggered = JSON.parse(
            localStorage.getItem(TRIGGERED_KEY) || "[]"
        );

        if (!Array.isArray(triggered)) {
            triggered = [];
        }

    } catch (error) {
        console.error("Unable to load triggered reminders:", error);
    }

    const now = new Date();

    for (const reminder of reminders) {

        if (
            reminder.completed ||
            !reminder.date ||
            !reminder.time
        ) {
            continue;
        }

        const reminderDateTime = new Date(
            `${reminder.date}T${reminder.time}`
        );

        if (Number.isNaN(reminderDateTime.getTime())) {
            continue;
        }

        const difference =
            now.getTime() - reminderDateTime.getTime();

        const triggerKey = String(reminder.id);

        if (
            difference >= 0 &&
            difference <= 5 * 60 * 1000 &&
            !triggered.includes(triggerKey)
        ) {

            triggered.push(triggerKey);

            localStorage.setItem(
                TRIGGERED_KEY,
                JSON.stringify(triggered)
            );

            showSelfCareNotification(reminder);
        }
    }
}


    /* =====================================
       DASHBOARD
       ===================================== */

if (dashboardBtn) {
    dashboardBtn.addEventListener("click", function () {
        window.location.href = "dashboard.html";
    });
}

    


    /* =====================================
       FORM
       ===================================== */

    selfCareForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            addReminder();

        }
    );


    /* =====================================
       NOTIFICATION BUTTON
       ===================================== */

    notificationBtn.addEventListener(
        "click",
        function () {

            enableNotifications();

        }
    );


    /* =====================================
       INITIALIZE
       ===================================== */

    setDefaultDate();

    showDailyMessage();

    renderReminders();

    updateNotificationUI();

    checkSelfCareReminders();

setInterval(checkSelfCareReminders, 30 * 1000);

document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
        checkSelfCareReminders();
    }
});

});