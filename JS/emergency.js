
/* =========================================================
   MINDMIRROR - EMERGENCY SUPPORT
========================================================= */

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const API_BASE = "https://mindmirror-backend-b6zj.onrender.com/api";

/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(path, options = {}) {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please log in to use Emergency Support.");
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
        // Empty response
    }

    if (!response.ok || data.status === "error") {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed (${response.status})`
        );
    }

    return data;
}

/* =========================================================
   MAIN
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const safeBtn = document.getElementById("safeBtn");
    const helpBtn = document.getElementById("helpBtn");
    const safetyMessage = document.getElementById("safetyMessage");

    const startVoiceBtn = document.getElementById("startVoiceBtn");
    const stopVoiceBtn = document.getElementById("stopVoiceBtn");

    const voiceStatus = document.getElementById("voiceStatus");
    const voiceStatusText = document.getElementById("voiceStatusText");
    const transcriptText = document.getElementById("transcriptText");

    const emergencyAlert = document.getElementById("emergencyAlert");
    const emergencyAlertText = document.getElementById("emergencyAlertText");

    const emergencyStatusCard = document.getElementById("emergencyStatusCard");
    const emergencyStatusTitle = document.getElementById("emergencyStatusTitle");
    const emergencyStatusText = document.getElementById("emergencyStatusText");

    const adultBtn = document.getElementById("adultBtn");
    const childBtn = document.getElementById("childBtn");
    const childHelpCard = document.getElementById("childHelpCard");

    const requestLocationBtn = document.getElementById("requestLocationBtn");
    const mapBtn = document.getElementById("mapBtn");

    const locationStatus = document.getElementById("locationStatus");
    const locationStatusText = document.getElementById("locationStatusText");

    const latitudeValue = document.getElementById("latitudeValue");
    const longitudeValue = document.getElementById("longitudeValue");

    const contactName = document.getElementById("contactName");
    const contactPhone = document.getElementById("contactPhone");
    const contactRelation = document.getElementById("contactRelation");

    const saveContactBtn = document.getElementById("saveContactBtn");
    const editContactBtn = document.getElementById("editContactBtn");
    const deleteContactBtn = document.getElementById("deleteContactBtn");

    const savedContact = document.getElementById("savedContact");
    const savedContactName = document.getElementById("savedContactName");
    const savedContactDetails = document.getElementById("savedContactDetails");

    const contactCallBtn = document.getElementById("contactCallBtn");
    const emergencyServicesBtn = document.getElementById("emergencyServicesBtn");
    const contactCallDescription = document.getElementById("contactCallDescription");

    const locationConsent = document.getElementById("locationConsent");
    const locationConsentText = document.getElementById("locationConsentText");

    const firstConsentBtn = document.getElementById("firstConsentBtn");
    const firstConsentActions = document.getElementById("firstConsentActions");
    const denyConsentBtn = document.getElementById("denyConsentBtn");

    const finalConsentActions = document.getElementById("finalConsentActions");
    const finalConsentBtn = document.getElementById("finalConsentBtn");
    const cancelConsentBtn = document.getElementById("cancelConsentBtn");

    /* =====================================================
       STATE
    ===================================================== */

    let recognition = null;
    let voiceActive = false;

    let emergencyTriggered = false;
    let emergencyInProgress = false;

    let selectedAge = null;

    let currentLatitude = null;
    let currentLongitude = null;

    let locationSharingConsented = false;
    let locationSavedForConsent = false;

    let lastEmergencyPhrase = "";
    let finalTranscript = "";

    let trustedContactId = null;
    let emergencyContact = null;

    let isEditingContact = false;

    /* =====================================================
       EMERGENCY PHRASES
    ===================================================== */

    const emergencyPatterns = [
        "emergency",
        "help me",
        "i need help",
        "i am in danger",
        "i'm in danger",
        "i dont feel safe",
        "i don't feel safe",
        "i do not feel safe",
        "i feel unsafe",
        "unsafe right now",
        "suicide",
        "suicidal",
        "kill myself",
        "hurt myself",
        "harm myself",
        "self harm",
        "self-harm",
        "end my life",
        "i cannot keep myself safe",
        "i can't keep myself safe",
        "call for help",
        "please help me"
    ];

    /* =====================================================
       NORMALIZE TEXT
    ===================================================== */

    function normalizeText(text) {

        return String(text || "")
            .toLowerCase()
            .replace(/[’']/g, "'")
            .replace(/[^\w\s'-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    /* =====================================================
       DETECT EMERGENCY
    ===================================================== */

    function detectEmergency(text) {

        const normalized = normalizeText(text);

        return emergencyPatterns.some(phrase =>
            normalized.includes(normalizeText(phrase))
        );
    }

    /* =====================================================
       STATUS FUNCTIONS
    ===================================================== */

    function setVoiceStatus(message, type = "") {

        voiceStatusText.textContent = message;
        voiceStatus.className = "voice-status";

        if (type) {
            voiceStatus.classList.add(type);
        }
    }

    function setLocationStatus(message, type = "") {

        locationStatusText.textContent = message;
        locationStatus.className = "location-status";

        if (type) {
            locationStatus.classList.add(type);
        }
    }

    function setEmergencyStatus(title, message, active = false) {

        emergencyStatusTitle.textContent = title;
        emergencyStatusText.textContent = message;

        emergencyStatusCard.classList.toggle("active", active);
    }

    /* =====================================================
       LOAD EMERGENCY CONTACT
    ===================================================== */

    function loadEmergencyContact() {

        // Prefer the contact loaded from Firebase.
        if (emergencyContact && emergencyContact.phone) {
            return emergencyContact;
        }

        try {

            const stored = localStorage.getItem(
                "mindmirrorEmergencyContact"
            );

            if (!stored) {
                return null;
            }

            const parsed = JSON.parse(stored);

            if (parsed && parsed.phone) {
                return parsed;
            }

        } catch (error) {

            console.error("Contact loading error:", error);

        }

        return null;
    }

    /* =====================================================
       DISPLAY CONTACT FROM FIREBASE
    ===================================================== */

    async function displayEmergencyContact() {

        try {

            const user = auth.currentUser;

            if (!user) {
                return;
            }

            const data = await apiRequest(
                `/trusted-contacts/${encodeURIComponent(user.uid)}`
            );

            console.log("Trusted Contacts Response:", data);

            if (
                data.status === "success" &&
                Array.isArray(data.contacts) &&
                data.contacts.length > 0
            ) {

                const stored = localStorage.getItem(
                    "mindmirrorEmergencyContact"
                );

                let previousContact = null;

                try {
                    previousContact = stored ? JSON.parse(stored) : null;
                } catch {
                    previousContact = null;
                }

                // Keep the previously selected contact if it still exists.
                let contact = data.contacts.find(
                    item =>
                        item.recipient_id === previousContact?.recipient_id
                );

                // Otherwise select the most recently created contact.
                if (!contact) {

                    contact = [...data.contacts].sort(
                        (a, b) =>
                            new Date(b.created_at || 0) -
                            new Date(a.created_at || 0)
                    )[0];

                }

                trustedContactId = contact.recipient_id;

                emergencyContact = {
                    name: contact.name,
                    phone: contact.phone,
                    relation: contact.relationship,
                    recipient_id: contact.recipient_id
                };

                localStorage.setItem(
                    "mindmirrorEmergencyContact",
                    JSON.stringify(emergencyContact)
                );

                savedContact.classList.add("show");

                savedContactName.textContent = emergencyContact.name;

                savedContactDetails.textContent =
                    `${emergencyContact.phone} • ${emergencyContact.relation}`;

                contactCallDescription.textContent =
                    `Configured contact: ${emergencyContact.name}`;

                contactName.value = emergencyContact.name;
                contactPhone.value = emergencyContact.phone;
                contactRelation.value = emergencyContact.relation;

                console.log(
                    "Emergency contact loaded:",
                    emergencyContact
                );

            } else {

                trustedContactId = null;
                emergencyContact = null;
                isEditingContact = false;

                localStorage.removeItem(
                    "mindmirrorEmergencyContact"
                );

                savedContact.classList.add("show");

                savedContactName.textContent = "No contact saved";
                savedContactDetails.textContent = "";

                contactCallDescription.textContent =
                    "No emergency contact configured.";

                contactName.value = "";
                contactPhone.value = "";
                contactRelation.value = "";

                saveContactBtn.textContent = "Save Emergency Contact";
            }

        } catch (error) {

            console.error("Trusted contact loading error:", error);

            setLocationStatus(
                "Unable to retrieve emergency contact.",
                "error"
            );
        }
    }

    /* =====================================================
       SAVE / UPDATE CONTACT
    ===================================================== */

    saveContactBtn?.addEventListener("click", async () => {

        const name = contactName.value.trim();
        const phone = contactPhone.value.trim();
        const relation = contactRelation.value.trim();

        if (!name || !phone || !relation) {

            alert(
                "Please enter contact name, phone number and relationship."
            );

            return;
        }

        const cleanedPhone = phone.replace(/[^\d+]/g, "");

        if (cleanedPhone.replace(/\D/g, "").length < 8) {

            alert("Please enter a valid phone number.");

            return;
        }

        saveContactBtn.disabled = true;

        try {

            if (isEditingContact) {

                if (!trustedContactId) {
                    throw new Error("Contact ID is missing. Please reload the contact.");
                }

                await apiRequest(
                    `/trusted-contacts/${encodeURIComponent(trustedContactId)}`,
                    {
                        method: "PUT",

                        body: JSON.stringify({
                            name: name,
                            phone: cleanedPhone,
                            relationship: relation
                        })
                    }
                );

                alert("Emergency contact updated successfully!");

            } else {

                const data = await apiRequest(
                    "/trusted-contacts",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            name: name,
                            phone: cleanedPhone,
                            relationship: relation
                        })
                    }
                );

                if (!data.recipient_id) {
                    throw new Error("The server did not return a contact ID.");
                }

                trustedContactId = data.recipient_id;

                alert("Emergency contact saved successfully!");
            }

            isEditingContact = false;

            saveContactBtn.textContent = "Save Emergency Contact";

            // Reload the latest contact details from Firebase.
            await displayEmergencyContact();

        } catch (error) {

            console.error("Contact saving error:", error);

            alert(error.message || "Could not save the contact.");

        } finally {

            saveContactBtn.disabled = false;

        }
    });

    /* =====================================================
       EDIT CONTACT
    ===================================================== */

    editContactBtn?.addEventListener("click", () => {

        if (!emergencyContact || !trustedContactId) {

            alert("No emergency contact available to edit.");

            return;
        }

        isEditingContact = true;

        contactName.value = emergencyContact.name;
        contactPhone.value = emergencyContact.phone;
        contactRelation.value = emergencyContact.relation;

        saveContactBtn.textContent = "Update Emergency Contact";

        contactName.focus();

    });

    /* =====================================================
   DELETE ALL SAVED EMERGENCY CONTACTS
===================================================== */

deleteContactBtn?.addEventListener("click", async () => {

    if (!trustedContactId) {
        alert("No emergency contact available to delete.");
        return;
    }

    const confirmDelete = confirm(
        "Are you sure you want to delete all saved emergency contacts?"
    );

    if (!confirmDelete) {
        return;
    }

    deleteContactBtn.disabled = true;
    saveContactBtn.disabled = true;

    try {

        const user = auth.currentUser;

        if (!user) {
            throw new Error("Please log in first.");
        }

        // Get all saved contacts belonging to this user.
        const data = await apiRequest(
            `/trusted-contacts/${encodeURIComponent(user.uid)}`
        );

        const contacts = Array.isArray(data.contacts)
            ? data.contacts
            : [];

        if (contacts.length === 0) {
            throw new Error("No saved emergency contacts found.");
        }

        // Delete every saved contact from Firebase.
        for (const contact of contacts) {

            if (!contact.recipient_id) {
                continue;
            }

            await apiRequest(
                `/trusted-contacts/${encodeURIComponent(contact.recipient_id)}`,
                {
                    method: "DELETE"
                }
            );
        }

        // Clear contact information.
        trustedContactId = null;
        emergencyContact = null;
        isEditingContact = false;

        localStorage.removeItem(
            "mindmirrorEmergencyContact"
        );

        contactName.value = "";
        contactPhone.value = "";
        contactRelation.value = "";

        saveContactBtn.textContent = "Save Emergency Contact";

        // Refresh the display from the database.
        await displayEmergencyContact();

        alert("All saved emergency contacts deleted successfully!");

    } catch (error) {

        console.error("Contact deletion error:", error);

        alert(
            error.message || "Could not delete emergency contacts."
        );

        // Refresh to show the actual database state.
        await displayEmergencyContact();

    } finally {

        deleteContactBtn.disabled = false;
        saveContactBtn.disabled = false;

    }
});
    /* =====================================================
       LOCATION CONSENT - FIRST CONFIRMATION
    ===================================================== */

    firstConsentBtn?.addEventListener("click", async () => {

        try {

            const data = await apiRequest(
                "/voice/location-consent",
                {
                    method: "POST",

                    body: JSON.stringify({
                        first_answer: "yes"
                    })
                }
            );

            if (data.status === "confirmation_required") {

                locationConsentText.textContent =
                    "Are you sure you want to share your location with your saved trusted contact?";

                firstConsentActions.hidden = true;
                finalConsentActions.hidden = false;
            }

        } catch (error) {

            console.error("First consent error:", error);

            alert("Could not process your consent. Please try again.");
        }
    });

    /* =====================================================
       LOCATION CONSENT - DENY
    ===================================================== */

    denyConsentBtn?.addEventListener("click", async () => {

        try {

            await apiRequest(
                "/voice/location-consent",
                {
                    method: "POST",

                    body: JSON.stringify({
                        first_answer: "no"
                    })
                }
            );

            locationSharingConsented = false;
            locationSavedForConsent = false;

            locationConsent.hidden = true;
            finalConsentActions.hidden = true;
            firstConsentActions.hidden = false;

            setLocationStatus(
                "Location sharing was declined.",
                "error"
            );

        } catch (error) {

            console.error("Consent denial error:", error);

            alert("Could not process your response. Please try again.");
        }
    });

    /* =====================================================
       LOCATION CONSENT - FINAL CONFIRMATION
    ===================================================== */

    finalConsentBtn?.addEventListener("click", async () => {

        try {

            const data = await apiRequest(
                "/voice/location-consent",
                {
                    method: "POST",

                    body: JSON.stringify({
                        first_answer: "yes",
                        final_answer: "yes"
                    })
                }
            );

            if (data.consent_given === true) {

                locationSharingConsented = true;
                locationSavedForConsent = false;

                locationConsent.hidden = true;

                setLocationStatus(
                    "Consent confirmed. Requesting location..."
                );

                await requestEmergencyLocation();

            } else {

                alert("Location sharing was not approved.");

            }

        } catch (error) {

            console.error("Final consent error:", error);

            alert("Could not confirm your consent. Please try again.");
        }
    });

    /* =====================================================
       LOCATION CONSENT - CANCEL
    ===================================================== */

    cancelConsentBtn?.addEventListener("click", async () => {

        try {

            await apiRequest(
                "/voice/location-consent",
                {
                    method: "POST",

                    body: JSON.stringify({
                        first_answer: "yes",
                        final_answer: "no"
                    })
                }
            );

            locationSharingConsented = false;
            locationSavedForConsent = false;

            locationConsent.hidden = true;
            finalConsentActions.hidden = true;
            firstConsentActions.hidden = false;

            setLocationStatus(
                "Location sharing cancelled.",
                "error"
            );

        } catch (error) {

            console.error("Consent cancellation error:", error);

            alert("Could not process your response. Please try again.");
        }
    });

    /* =====================================================
       AGE SELECTION
    ===================================================== */

    adultBtn?.addEventListener("click", () => {

        selectedAge = "adult";

        adultBtn.classList.add("selected");
        childBtn.classList.remove("selected");

        childHelpCard.classList.remove("show");

    });

    childBtn?.addEventListener("click", () => {

        selectedAge = "child";

        childBtn.classList.add("selected");
        adultBtn.classList.remove("selected");

        childHelpCard.classList.add("show");

    });

    /* =====================================================
       SAFE BUTTON
    ===================================================== */

    safeBtn?.addEventListener("click", () => {

        emergencyTriggered = false;
        emergencyInProgress = false;

        emergencyAlert.classList.remove("show");

        setEmergencyStatus(
            "No emergency detected",
            "You marked yourself as safe.",
            false
        );

        safetyMessage.textContent =
            "I'm glad you are safe. You can continue using MindMirror normally.";

    });

    /* =====================================================
       HELP BUTTON
    ===================================================== */

    helpBtn?.addEventListener("click", () => {

        triggerEmergency("User requested emergency help");

    });

    /* =====================================================
       VOICE BUTTONS
    ===================================================== */

    startVoiceBtn?.addEventListener(
        "click",
        startVoiceSupport
    );

    stopVoiceBtn?.addEventListener(
        "click",
        stopVoiceSupport
    );

    /* =====================================================
       CREATE SPEECH RECOGNITION
    ===================================================== */

    function createRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            setVoiceStatus(
                "Voice recognition is not supported in this browser.",
                "error"
            );

            return null;
        }

        const instance = new SpeechRecognition();

        instance.continuous = true;
        instance.interimResults = true;
        instance.lang = "en-IN";
        instance.maxAlternatives = 1;

        instance.onresult = (event) => {

            let interim = "";
            let newFinalText = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const result = event.results[i];
                const transcript = result[0].transcript;

                if (result.isFinal) {
                    newFinalText += transcript + " ";
                } else {
                    interim += transcript;
                }
            }

            if (newFinalText) {
                finalTranscript += newFinalText;
            }

            const displayTranscript = (
                finalTranscript + " " + interim
            ).trim();

            transcriptText.textContent =
                displayTranscript || "Listening...";

            const textToCheck = (
                finalTranscript + " " + interim
            ).trim();

            if (detectEmergency(textToCheck)) {

                const match = emergencyPatterns.find(
                    phrase =>
                        normalizeText(textToCheck).includes(
                            normalizeText(phrase)
                        )
                );

                triggerEmergency(
                    match || "Emergency phrase detected"
                );
            }
        };

        instance.onerror = (event) => {

            console.error(
                "Speech recognition error:",
                event.error
            );

            if (event.error === "not-allowed") {

                setVoiceStatus(
                    "Microphone permission was denied.",
                    "error"
                );

                return;
            }

            if (event.error === "no-speech") {
                return;
            }

            setVoiceStatus(
                `Voice recognition error: ${event.error}`,
                "error"
            );
        };

        instance.onend = () => {

            if (voiceActive && !emergencyInProgress) {

                try {
                    instance.start();
                } catch {
                    console.log("Recognition restart skipped.");
                }
            }
        };

        return instance;
    }

    /* =====================================================
       START VOICE SUPPORT
    ===================================================== */

    function startVoiceSupport() {

        if (voiceActive) {
            return;
        }

        recognition = createRecognition();

        if (!recognition) {
            return;
        }

        finalTranscript = "";

        transcriptText.textContent = "Listening...";

        voiceActive = true;

        startVoiceBtn.disabled = true;
        stopVoiceBtn.disabled = false;

        voiceStatus.classList.add("active");

        voiceStatusText.textContent =
            "Listening for emergency speech...";

        try {

            recognition.start();

        } catch (error) {

            console.error(
                "Could not start speech recognition:",
                error
            );

            voiceActive = false;

            startVoiceBtn.disabled = false;
            stopVoiceBtn.disabled = true;

            setVoiceStatus(
                "Could not start voice support.",
                "error"
            );
        }
    }

    /* =====================================================
       STOP VOICE SUPPORT
    ===================================================== */

    function stopVoiceSupport() {

        voiceActive = false;

        if (recognition) {

            try {

                recognition.onend = null;
                recognition.stop();

            } catch {
                console.log("Recognition already stopped.");
            }
        }

        recognition = null;

        startVoiceBtn.disabled = false;
        stopVoiceBtn.disabled = true;

        setVoiceStatus("Voice support is not active");
    }

    /* =====================================================
       TRIGGER EMERGENCY
    ===================================================== */

    function triggerEmergency(emergencyPhrase) {

        if (emergencyTriggered || emergencyInProgress) {
            return;
        }

        emergencyTriggered = true;
        emergencyInProgress = true;

        lastEmergencyPhrase = emergencyPhrase;

        voiceActive = false;

        if (recognition) {

            try {

                recognition.onend = null;
                recognition.stop();

            } catch {
                console.log("Recognition stopped.");
            }
        }

        recognition = null;

        startVoiceBtn.disabled = false;
        stopVoiceBtn.disabled = true;

        emergencyAlert.classList.add("show");

        emergencyAlertText.textContent =
            `Detected: "${emergencyPhrase}". Emergency support is being activated.`;

        setEmergencyStatus(
            "Emergency detected",
            "MindMirror has detected emergency speech and started the emergency workflow.",
            true
        );

        setVoiceStatus("Emergency detected", "error");

        safetyMessage.textContent =
            "Emergency support has been activated.";

        startAutomaticEmergencyWorkflow();
    }

    /* =====================================================
       AUTOMATIC EMERGENCY WORKFLOW
    ===================================================== */

    async function startAutomaticEmergencyWorkflow() {

        setEmergencyStatus(
            "Emergency support active",
            "Getting location and preparing emergency contact support.",
            true
        );

        await requestEmergencyLocation();

        await sendEmergencyToBackend();

        const contact = loadEmergencyContact();

        if (contact && contact.phone) {

            setEmergencyStatus(
                "Calling emergency contact",
                `Opening the phone dialer for ${contact.name || "your emergency contact"}.`,
                true
            );

            callNumberAutomatically(contact.phone);

            setTimeout(() => {
                showEmergencyFallback();
            }, 7000);

            return;
        }

        showEmergencyFallback();
    }

    /* =====================================================
       REQUEST EMERGENCY LOCATION
    ===================================================== */

    function requestEmergencyLocation() {

        return new Promise((resolve) => {

            setLocationStatus(
                "Requesting emergency location..."
            );

            window.dispatchEvent(
                new CustomEvent(
                    "mindmirror:request-location",
                    {
                        detail: {
                            reason: "voice_emergency",
                            emergencyPhrase: lastEmergencyPhrase,
                            transcript: finalTranscript,
                            timestamp: new Date().toISOString()
                        }
                    }
                )
            );

            if (!navigator.geolocation) {

                setLocationStatus(
                    "Waiting for Unity / Android location."
                );

                resolve();
                return;
            }

            navigator.geolocation.getCurrentPosition(

                position => {

                    console.log("Browser location:", {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        source: "browser"
                    });

                    handleLocationReceived(
                        position.coords.latitude,
                        position.coords.longitude,
                        {
                            source: "browser",
                            accuracy: position.coords.accuracy
                        }
                    );

                    resolve();
                },

                error => {

                    console.warn(
                        "Browser location unavailable:",
                        error
                    );

                    setLocationStatus(
                        "Waiting for Unity / Android location."
                    );

                    resolve();
                },

                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    /* =====================================================
       RECEIVE LOCATION FROM BROWSER OR UNITY
    ===================================================== */

    function handleLocationReceived(
        latitude,
        longitude,
        metadata = {}
    ) {

        const lat = Number(latitude);
        const lng = Number(longitude);
        const accuracy = Number(metadata.accuracy);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {

            setLocationStatus(
                "Invalid location received.",
                "error"
            );

            return;
        }

        if (
            metadata.source === "browser" &&
            (!Number.isFinite(accuracy) || accuracy > 1000)
        ) {

            currentLatitude = null;
            currentLongitude = null;

            latitudeValue.textContent = "—";
            longitudeValue.textContent = "—";

            mapBtn.disabled = true;

            setLocationStatus(
                "Location is too inaccurate. Please try again or use your phone's GPS.",
                "error"
            );

            return;
        }

        currentLatitude = lat;
        currentLongitude = lng;

        latitudeValue.textContent = lat.toFixed(6);
        longitudeValue.textContent = lng.toFixed(6);

        const accuracyText = Number.isFinite(accuracy)
            ? ` Accuracy: approximately ${Math.round(accuracy)} metres.`
            : "";

        setLocationStatus(
            `Location received.${accuracyText}`,
            "success"
        );

        mapBtn.disabled = false;

        window.dispatchEvent(
            new CustomEvent(
                "mindmirror:emergency-location-ready",
                {
                    detail: {
                        event: "emergency_detected",
                        emergencyPhrase: lastEmergencyPhrase,
                        transcript: finalTranscript,
                        latitude: lat,
                        longitude: lng,
                        locationConfirmed: true,
                        metadata: metadata,
                        timestamp: new Date().toISOString()
                    }
                }
            )
        );

        if (
            locationSharingConsented &&
            !locationSavedForConsent
        ) {

            locationSavedForConsent = true;
            saveEmergencyLocation();
        }
    }

    /* =====================================================
       LISTEN FOR UNITY LOCATION
    ===================================================== */

    window.addEventListener(
        "mindmirror:location-received",
        event => {

            const detail = event.detail || {};

            handleLocationReceived(
                detail.latitude,
                detail.longitude,
                detail.metadata || {}
            );
        }
    );

    /* =====================================================
       AUTOMATIC PHONE CALL
    ===================================================== */

    function callNumberAutomatically(phone) {

        if (!phone) {
            return false;
        }

        const cleaned = String(phone).replace(/[^\d+]/g, "");

        if (!cleaned) {
            return false;
        }

        window.location.href = `tel:${cleaned}`;

        return true;
    }

    /* =====================================================
       EMERGENCY FALLBACK
    ===================================================== */

    function showEmergencyFallback() {

        setEmergencyStatus(
            "Emergency contact fallback",
            "If your emergency contact did not respond or could not be reached, use emergency services.",
            true
        );

        emergencyAlert.classList.add("show");

        emergencyAlertText.innerHTML = `
            Emergency contact could not be confirmed.
            <br><br>
            <strong>Use 112 for immediate emergency assistance.</strong>
        `;

        emergencyServicesBtn.focus();
    }

    /* =====================================================
       MANUAL CONTACT CALL
    ===================================================== */

    contactCallBtn?.addEventListener("click", () => {

        const contact = loadEmergencyContact();

        if (!contact || !contact.phone) {

            alert("Please save an emergency contact first.");

            return;
        }

        callNumberAutomatically(contact.phone);
    });

    /* =====================================================
       MANUAL EMERGENCY CALL
    ===================================================== */

    emergencyServicesBtn?.addEventListener("click", () => {

        callNumberAutomatically("112");

    });

    /* =====================================================
       REQUEST LOCATION BUTTON
    ===================================================== */

    requestLocationBtn?.addEventListener("click", () => {

        console.log("Request Location clicked");

        console.log(
            "Current trustedContactId:",
            trustedContactId
        );

        console.log(
            "Current emergencyContact:",
            emergencyContact
        );

        if (!trustedContactId) {

            alert("Please save an emergency contact first.");

            return;
        }

        locationConsent.hidden = false;

        locationConsentText.textContent =
            "Do you agree to share your location with your saved trusted contact during an emergency?";

        firstConsentActions.hidden = false;
        finalConsentActions.hidden = true;
    });

    /* =====================================================
       VIEW LOCATION ON MAP
    ===================================================== */

    mapBtn?.addEventListener("click", () => {

        if (
            currentLatitude === null ||
            currentLongitude === null
        ) {
            return;
        }

        const mapUrl =
            `https://www.google.com/maps?q=${currentLatitude},${currentLongitude}`;

        window.open(
            mapUrl,
            "_blank",
            "noopener,noreferrer"
        );
    });

    /* =====================================================
       SEND EMERGENCY TO BACKEND
    ===================================================== */

    async function sendEmergencyToBackend() {

        try {

            const payload = {

                emergency_type: "Emergency Support",

                location:
                    currentLatitude !== null &&
                    currentLongitude !== null
                        ? `Latitude: ${currentLatitude}, Longitude: ${currentLongitude}`
                        : null,

                message:
                    finalTranscript ||
                    lastEmergencyPhrase ||
                    "Emergency support requested."
            };

            const data = await apiRequest(
                "/emergency",
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );

            console.log(
                "Emergency saved successfully:",
                data
            );

            return true;

        } catch (error) {

            console.error(
                "Emergency backend error:",
                error
            );

            return false;
        }
    }

    /* =====================================================
       SAVE EMERGENCY LOCATION
    ===================================================== */

    async function saveEmergencyLocation() {

        if (!trustedContactId) {

            alert("Please save an emergency contact first.");

            return;
        }

        if (
            currentLatitude === null ||
            currentLongitude === null
        ) {

            alert("Location is not available.");

            return;
        }

        try {

            const data = await apiRequest(
                "/location",
                {
                    method: "POST",

                    body: JSON.stringify({
                        latitude: currentLatitude,
                        longitude: currentLongitude,
                        recipient_id: trustedContactId,
                        consent_given: true,
                        emergency_type: "Emergency Support",
                        message:
                            lastEmergencyPhrase ||
                            "Emergency location shared."
                    })
                }
            );

            console.log("Location saved:", data);

            setLocationStatus(
                "Emergency location saved successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Location saving error:",
                error
            );

            setLocationStatus(
                "Could not save emergency location.",
                "error"
            );
        }
    }

    /* =====================================================
       FIREBASE AUTHENTICATION
    ===================================================== */

    onAuthStateChanged(auth, async (user) => {

        if (user) {

            console.log(
                "Firebase user loaded:",
                user.uid
            );

            await displayEmergencyContact();

        } else {

            console.log("No user is logged in.");

            trustedContactId = null;
            emergencyContact = null;
            isEditingContact = false;

            savedContact.classList.add("show");

            savedContactName.textContent = "No contact saved";
            savedContactDetails.textContent = "";

            contactCallDescription.textContent =
                "Please log in to manage your emergency contact.";

            contactName.value = "";
            contactPhone.value = "";
            contactRelation.value = "";

            localStorage.removeItem(
                "mindmirrorEmergencyContact"
            );

            saveContactBtn.textContent =
                "Save Emergency Contact";
        }
    });

    /* =====================================================
       INITIAL STATUS
    ===================================================== */

    setEmergencyStatus(
        "No emergency detected",
        "Voice emergency monitoring is ready.",
        false
    );

});
