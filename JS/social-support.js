
import { auth } from "./firebase-config.js";

const API_BASE = "https://mindmirror-backend-b6zj.onrender.com/api";

/* ================= STATE ================= */

let people = [];
let selectedFeeling = null;
let selectedPerson = null;
let selectedStatus = null;
let selectedFollowUp = null;

let toastTimer = null;

/* ================= DOM ================= */

const feelingOptions = document.querySelectorAll(".feeling-option");

const peopleSection = document.getElementById("peopleSection");
const peopleList = document.getElementById("peopleList");
const addPersonBtn = document.getElementById("addPersonBtn");
const noPeopleMessage = document.getElementById("noPeopleMessage");

const reachOutSection = document.getElementById("reachOutSection");
const selectedPersonName = document.getElementById("selectedPersonName");
const selectedPersonRelationship = document.getElementById("selectedPersonRelationship");
const selectedPersonAvatar = document.getElementById("selectedPersonAvatar");

const supportMessage = document.getElementById("supportMessage");
const editMessageBtn = document.getElementById("editMessageBtn");

const callBtn = document.getElementById("callBtn");
const messageBtn = document.getElementById("messageBtn");
const whatsappBtn = document.getElementById("whatsappBtn");
const copyMessageBtn = document.getElementById("copyMessageBtn");

const statusSection = document.getElementById("statusSection");
const statusOptions = document.querySelectorAll(".status-option");
const saveActionBtn = document.getElementById("saveActionBtn");

const followUpSection = document.getElementById("followUpSection");
const followUpOptions = document.querySelectorAll(".followup-options button");

/* ================= MODAL ================= */

const personModal = document.getElementById("personModal");
const closePersonModal = document.getElementById("closePersonModal");

const personName = document.getElementById("personName");
const personRelationship = document.getElementById("personRelationship");
const personPhone = document.getElementById("personPhone");
const preferredMethod = document.getElementById("preferredMethod");

const savePersonBtn = document.getElementById("savePersonBtn");

/* ================= TOAST ================= */

const toast = document.getElementById("toast");

/* ================= AUTHENTICATION ================= */

async function getAuthToken() {
    if (typeof auth.authStateReady === "function") {
        await auth.authStateReady();
    }

    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please log in to continue.");
    }

    const token = await user.getIdToken();

    return {
        user,
        token
    };
}

/* ================= API REQUEST ================= */

async function apiRequest(url, options = {}) {
    const { token } = await getAuthToken();

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const result = await response.json();

    if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}

/* =========================================================
   FEELING SELECTION
   ========================================================= */

feelingOptions.forEach(option => {
    option.addEventListener("click", () => {
        feelingOptions.forEach(item => {
            item.classList.remove("selected");
        });

        option.classList.add("selected");

        selectedFeeling = option.dataset.feeling;

        showPeopleSection();
    });
});

/* =========================================================
   SHOW PEOPLE
   ========================================================= */

function showPeopleSection() {
    peopleSection.classList.remove("hidden");

    renderPeople();

    peopleSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* =========================================================
   LOAD TRUSTED CONTACTS
   ========================================================= */

async function loadPeople() {
    try {
        const { user } = await getAuthToken();

        const result = await apiRequest(
            `/trusted-contacts/${encodeURIComponent(user.uid)}`
        );

        people = Array.isArray(result.contacts)
            ? result.contacts
            : [];

        renderPeople();

    } catch (error) {
        console.error("Unable to load trusted contacts:", error);

        showToast(error.message || "Unable to load contacts.");
    }
}

/* =========================================================
   RENDER PEOPLE
   ========================================================= */

function renderPeople() {
    peopleList.innerHTML = "";

    if (people.length === 0) {
        noPeopleMessage.classList.remove("hidden");
        return;
    }

    noPeopleMessage.classList.add("hidden");

    people.forEach(person => {
        const card = document.createElement("div");
        card.className = "person-card";

        const avatar = document.createElement("div");
        avatar.className = "person-avatar";
        avatar.textContent = "👤";

        const info = document.createElement("div");
        info.className = "person-info";

        const name = document.createElement("h3");
        name.textContent = person.name || "";

        const relationship = document.createElement("p");
        relationship.textContent = person.relationship || "";

        info.appendChild(name);
        info.appendChild(relationship);

        const selectButton = document.createElement("button");
        selectButton.type = "button";
        selectButton.className = "person-select";
        selectButton.textContent = "Reach Out";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-person";
        deleteButton.title = "Delete person";
        deleteButton.textContent = "×";

        selectButton.addEventListener("click", () => {
            selectPerson(person);
        });

        deleteButton.addEventListener("click", event => {
            event.stopPropagation();
            deletePerson(person.recipient_id);
        });

        card.appendChild(avatar);
        card.appendChild(info);
        card.appendChild(selectButton);
        card.appendChild(deleteButton);

        peopleList.appendChild(card);
    });
}

/* =========================================================
   ADD PERSON MODAL
   ========================================================= */

addPersonBtn.addEventListener("click", () => {
    personModal.classList.remove("hidden");
    personName.focus();
});

closePersonModal.addEventListener("click", closePersonModalWindow);

personModal.addEventListener("click", event => {
    if (event.target === personModal) {
        closePersonModalWindow();
    }
});

function closePersonModalWindow() {
    personModal.classList.add("hidden");
    clearPersonForm();
}

/* =========================================================
   SAVE PERSON
   ========================================================= */

savePersonBtn.addEventListener("click", savePerson);

async function savePerson() {
    const name = personName.value.trim();
    const relationship = personRelationship.value.trim();
    const phone = personPhone.value.trim();

    if (!name) {
        showToast("Please enter their name.");
        personName.focus();
        return;
    }

    if (!relationship) {
        showToast("Please enter the relationship.");
        personRelationship.focus();
        return;
    }

    if (!phone) {
        showToast("Please enter a phone number.");
        personPhone.focus();
        return;
    }

    savePersonBtn.disabled = true;

    try {
        const result = await apiRequest("/trusted-contacts", {
            method: "POST",
            body: JSON.stringify({
                name,
                relationship,
                phone
            })
        });

        people.push({
            recipient_id: result.recipient_id,
            name,
            relationship,
            phone
        });

        closePersonModalWindow();

        renderPeople();

        showToast(`${name} was added to your support circle.`);

    } catch (error) {
        console.error("Save contact error:", error);
        showToast(error.message || "Unable to save contact.");

    } finally {
        savePersonBtn.disabled = false;
    }
}

/* =========================================================
   CLEAR PERSON FORM
   ========================================================= */

function clearPersonForm() {
    personName.value = "";
    personRelationship.value = "";
    personPhone.value = "";
    preferredMethod.value = "call";
}

/* =========================================================
   DELETE PERSON
   ========================================================= */

async function deletePerson(recipientId) {
    const confirmed = window.confirm(
        "Remove this person from your support circle?"
    );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(
            `/trusted-contacts/${encodeURIComponent(recipientId)}`,
            {
                method: "DELETE"
            }
        );

        people = people.filter(
            person => person.recipient_id !== recipientId
        );

        if (
            selectedPerson &&
            selectedPerson.recipient_id === recipientId
        ) {
            selectedPerson = null;

            reachOutSection.classList.add("hidden");
            statusSection.classList.add("hidden");
            followUpSection.classList.add("hidden");
        }

        renderPeople();

        showToast("Person removed.");

    } catch (error) {
        console.error("Delete contact error:", error);
        showToast(error.message || "Unable to delete contact.");
    }
}

/* =========================================================
   SELECT PERSON
   ========================================================= */

function selectPerson(person) {
    selectedPerson = person;

    selectedPersonName.textContent = person.name || "";
    selectedPersonRelationship.textContent = person.relationship || "";

    selectedPersonAvatar.textContent = getPersonEmoji(
        person.relationship || ""
    );

    supportMessage.value = createSuggestedMessage(
        selectedFeeling,
        person.name
    );

    supportMessage.readOnly = true;
    supportMessage.classList.remove("editable");

    editMessageBtn.textContent = "Edit";

    reachOutSection.classList.remove("hidden");
    statusSection.classList.remove("hidden");

    selectedStatus = null;
    selectedFollowUp = null;

    statusOptions.forEach(option => {
        option.classList.remove("selected");
    });

    followUpOptions.forEach(option => {
        option.classList.remove("selected");
    });

    followUpSection.classList.add("hidden");

    reachOutSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* =========================================================
   PERSON EMOJI
   ========================================================= */

function getPersonEmoji(relationship) {
    const value = relationship.toLowerCase();

    if (
        value.includes("mother") ||
        value.includes("mom") ||
        value.includes("mum")
    ) {
        return "👩";
    }

    if (
        value.includes("father") ||
        value.includes("dad")
    ) {
        return "👨";
    }

    if (
        value.includes("sister") ||
        value.includes("brother") ||
        value.includes("sibling")
    ) {
        return "🧑";
    }

    if (value.includes("friend")) {
        return "🧑‍🤝‍🧑";
    }

    return "👤";
}

/* =========================================================
   SUGGESTED MESSAGE
   ========================================================= */

function createSuggestedMessage(feeling, name) {
    const messages = {
        "Lonely":
            `Hi ${name}, I've been feeling a little lonely today. Could we talk for a few minutes?`,

        "Worried":
            `Hi ${name}, I'm feeling a bit worried today. I could really use someone to talk to.`,

        "Low":
            `Hi ${name}, I'm having a difficult day and I'm feeling a little low. Could we talk?`,

        "Overwhelmed":
            `Hi ${name}, I'm feeling a little overwhelmed right now. Could you stay with me or talk for a while?`,

        "Need someone":
            `Hi ${name}, I'm not feeling okay right now. Could we talk for a few minutes?`
    };

    return messages[feeling] ||
        `Hi ${name}, I'm having a difficult day. Could we talk for a few minutes?`;
}

/* =========================================================
   EDIT MESSAGE
   ========================================================= */

editMessageBtn.addEventListener("click", () => {
    if (supportMessage.readOnly) {
        supportMessage.readOnly = false;
        supportMessage.classList.add("editable");
        supportMessage.focus();

        editMessageBtn.textContent = "Done";

    } else {
        supportMessage.readOnly = true;
        supportMessage.classList.remove("editable");

        editMessageBtn.textContent = "Edit";
    }
});

/* =========================================================
   CALL
   ========================================================= */

callBtn.addEventListener("click", () => {
    if (!selectedPerson) {
        return;
    }

    window.location.href =
        `tel:${cleanPhoneNumber(selectedPerson.phone)}`;

    showToast(`Opening call for ${selectedPerson.name}...`);
});

/* =========================================================
   SMS
   ========================================================= */

messageBtn.addEventListener("click", () => {
    if (!selectedPerson) {
        return;
    }

    const message = supportMessage.value;
    const phone = cleanPhoneNumber(selectedPerson.phone);

    window.location.href =
        `sms:${phone}?body=${encodeURIComponent(message)}`;
});

/* =========================================================
   WHATSAPP
   ========================================================= */

whatsappBtn.addEventListener("click", () => {
    if (!selectedPerson) {
        return;
    }

    const message = supportMessage.value;
    const phone = cleanPhoneNumber(selectedPerson.phone);

    window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        "_blank"
    );
});

/* =========================================================
   CLEAN PHONE NUMBER
   ========================================================= */

function cleanPhoneNumber(phone) {
    return String(phone)
        .replace(/[^\d+]/g, "")
        .replace("+", "");
}

/* =========================================================
   COPY MESSAGE
   ========================================================= */

copyMessageBtn.addEventListener("click", async () => {
    const message = supportMessage.value;

    try {
        await navigator.clipboard.writeText(message);
        showToast("Message copied.");

    } catch (error) {
        supportMessage.select();
        document.execCommand("copy");

        showToast("Message copied.");
    }
});

/* =========================================================
   STATUS
   ========================================================= */

statusOptions.forEach(option => {
    option.addEventListener("click", () => {
        statusOptions.forEach(item => {
            item.classList.remove("selected");
        });

        option.classList.add("selected");

        selectedStatus = option.dataset.status;

        if (selectedStatus === "connected") {
            followUpSection.classList.remove("hidden");

        } else {
            followUpSection.classList.add("hidden");

            selectedFollowUp = null;

            followUpOptions.forEach(item => {
                item.classList.remove("selected");
            });
        }
    });
});

/* =========================================================
   FOLLOW UP
   ========================================================= */

followUpOptions.forEach(option => {
    option.addEventListener("click", () => {
        followUpOptions.forEach(item => {
            item.classList.remove("selected");
        });

        option.classList.add("selected");

        selectedFollowUp = option.dataset.feeling;

        showToast("Thank you for checking in with yourself.");
    });
});

/* =========================================================
   STATUS TEXT
   ========================================================= */

function getStatusText(status) {
    if (status === "reached_out") {
        return "I reached out";
    }

    if (status === "connected") {
        return "We connected";
    }

    if (status === "still_need_support") {
        return "I still need support";
    }

    return "Not specified";
}

/* =========================================================
   SAVE SUPPORT ACTION
   ========================================================= */

saveActionBtn.addEventListener("click", saveSupportAction);

async function saveSupportAction() {
    if (!selectedPerson) {
        showToast("Please choose someone to reach out to.");
        return;
    }

    if (!selectedStatus) {
        showToast("Please choose what happened.");
        return;
    }

    if (selectedStatus === "connected" && !selectedFollowUp) {
        showToast("Please choose how you feel now.");
        return;
    }

    saveActionBtn.disabled = true;

    try {
        const guidance = [
            `Feeling: ${selectedFeeling || "Not specified"}`,
            `Person: ${selectedPerson.name || "Not specified"}`,
            `Relationship: ${selectedPerson.relationship || "Not specified"}`,
            `Message: ${supportMessage.value}`,
            `Contact status: ${getStatusText(selectedStatus)}`,
            `Follow-up feeling: ${selectedFollowUp || "Not selected"}`
        ].join("\n");

        const result = await apiRequest("/social-support", {
            method: "POST",
            body: JSON.stringify({
                support_type: "Personal connection",
                guidance,
                contacted: selectedStatus !== "still_need_support"
            })
        });

        console.log("Social Support saved:", result.support_id);

        showToast("Your support action was saved successfully.");

        resetCurrentAction();

    } catch (error) {
        console.error("Social Support save error:", error);

        showToast(error.message || "Unable to save. Please try again.");

    } finally {
        saveActionBtn.disabled = false;
    }
}

/* =========================================================
   RESET
   ========================================================= */

function resetCurrentAction() {
    selectedPerson = null;
    selectedStatus = null;
    selectedFollowUp = null;

    reachOutSection.classList.add("hidden");
    statusSection.classList.add("hidden");
    followUpSection.classList.add("hidden");

    statusOptions.forEach(option => {
        option.classList.remove("selected");
    });

    followUpOptions.forEach(option => {
        option.classList.remove("selected");
    });
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {
    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

/* =========================================================
   INITIALIZE
   ========================================================= */

loadPeople();
