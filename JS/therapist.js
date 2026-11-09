
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const API_URL = "https://mindmirror-backend-b6zj.onrender.com/api/voice-assistant";

let sessionId = null;
let currentUser = null;
let isNewChat = true;
let historySessions = [];
let isLoadingHistory = false;

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const quickButtons = document.querySelectorAll(".quick-btn");
const speakBtn = document.getElementById("speakBtn");
const newChatBtn = document.getElementById("newChatBtn");
const historyList = document.getElementById("historyList");
const chatStatus = document.getElementById("chatStatus");

// ==========================================
// TEXT-TO-SPEECH
// ==========================================

let isSpeaking = false;

function updateSpeakButton() {
    if (speakBtn) {
        speakBtn.textContent = isSpeaking ? "⏹️" : "🔊";
    }
}

function speakVen(message) {
    if (!("speechSynthesis" in window)) {
        console.log("Speech is not supported.");
        return;
    }

    if (!message || !message.trim()) return;

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(message);

    speech.lang = "en-US";
    speech.rate = 0.95;
    speech.pitch = 1;

    speech.onstart = () => {
        isSpeaking = true;
        updateSpeakButton();
    };

    speech.onend = () => {
        isSpeaking = false;
        updateSpeakButton();
    };

    speech.onerror = () => {
        isSpeaking = false;
        updateSpeakButton();
    };

    speechSynthesis.speak(speech);
}

if (speakBtn) {
    speakBtn.addEventListener("click", () => {
        if (speechSynthesis.speaking || isSpeaking) {
            speechSynthesis.cancel();
            isSpeaking = false;
            updateSpeakButton();
            return;
        }

        const botMessages = chatBox.querySelectorAll(
            ".message.bot .message-text"
        );

        if (botMessages.length > 0) {
            speakVen(
                botMessages[botMessages.length - 1].textContent.trim()
            );
        }
    });
}

// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(message, sender) {
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = sender === "bot" ? "🌿" : "👤";

    const text = document.createElement("div");
    text.className = "message-text";

    // Preserve safe text rendering.
    text.textContent = message;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(text);

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ==========================================
// CLEAR CHAT
// ==========================================

function clearChat() {
    if (!chatBox) return;

    chatBox.innerHTML = "";

    speechSynthesis.cancel();
    isSpeaking = false;
    updateSpeakButton();
}

function showWelcomeMessage() {
    addMessage(
        "Hello! 👋 I'm Ven, your MindMirror companion.\n\nHow are you feeling today?",
        "bot"
    );
}

function setChatStatus(message) {
    if (chatStatus) {
        chatStatus.textContent = message;
    }
}

// ==========================================
// FIREBASE AUTH HEADER
// ==========================================

async function getAuthHeaders() {
    if (!currentUser) {
        throw new Error("Please log in first.");
    }

    const token = await currentUser.getIdToken();

    return {
        "Authorization": `Bearer ${token}`
    };
}

// ==========================================
// DATE FORMAT
// ==========================================

function getConversationDate(value) {
    if (!value) return "";

    let date;

    if (value.seconds) {
        date = new Date(value.seconds * 1000);
    } else if (value._seconds) {
        date = new Date(value._seconds * 1000);
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString();
}

// ==========================================
// NORMALIZE HISTORY RESPONSE
// ==========================================

function getConversationArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.conversations)) {
        return data.conversations;
    }

    if (Array.isArray(data.history)) {
        return data.history;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    return [];
}

// ==========================================
// LOAD PREVIOUS CHATS
// ==========================================

async function loadConversationHistory() {
    if (!currentUser || isLoadingHistory) return;

    isLoadingHistory = true;

    try {
        const headers = await getAuthHeaders();

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(currentUser.uid)}`,
            {
                method: "GET",
                headers
            }
        );

        if (!response.ok) {
            throw new Error(`History API error: ${response.status}`);
        }

        const data = await response.json();

        console.log("Conversation history:", data);

        const conversations = getConversationArray(data);

        // Group messages by session_id.
        const sessionMap = new Map();

        conversations.forEach(conversation => {
            const id = conversation.session_id;

            if (!id) return;

            if (!sessionMap.has(id)) {
                sessionMap.set(id, []);
            }

            sessionMap.get(id).push(conversation);
        });

        historySessions = Array.from(sessionMap.entries()).map(
            ([id, messages]) => {
                messages.sort((a, b) => {
                    return getTimestamp(a.created_at) -
                           getTimestamp(b.created_at);
                });

                return {
                    sessionId: id,
                    messages,
                    title: getSessionTitle(messages),
                    date: messages[messages.length - 1]?.created_at
                };
            }
        );

        // Most recent conversations first.
        historySessions.sort((a, b) => {
            return getTimestamp(b.date) - getTimestamp(a.date);
        });

        renderHistorySidebar();

    } catch (error) {
        console.error("Failed to load conversation history:", error);

        if (historyList) {
            historyList.innerHTML =
                '<p class="history-empty">Unable to load previous chats.</p>';
        }

    } finally {
        isLoadingHistory = false;
    }
}

// ==========================================
// TIMESTAMP HELPER
// ==========================================

function getTimestamp(value) {
    if (!value) return 0;

    if (value.seconds) {
        return value.seconds * 1000;
    }

    if (value._seconds) {
        return value._seconds * 1000;
    }

    const date = new Date(value).getTime();

    return Number.isNaN(date) ? 0 : date;
}

// ==========================================
// SESSION TITLE
// ==========================================

function getSessionTitle(messages) {
    const firstMessage = messages.find(item => item.user_message);

    if (!firstMessage) {
        return "Ven Conversation";
    }

    let title = firstMessage.user_message.trim();

    if (title.length > 32) {
        title = title.substring(0, 32) + "...";
    }

    return title || "Ven Conversation";
}

// ==========================================
// RENDER SIDEBAR
// ==========================================

function renderHistorySidebar() {
    if (!historyList) return;

    historyList.innerHTML = "";

    if (historySessions.length === 0) {
        historyList.innerHTML =
            '<p class="history-empty">No previous chats yet.</p>';
        return;
    }

    historySessions.forEach(session => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "history-item";

        if (session.sessionId === sessionId && !isNewChat) {
            button.classList.add("active");
        }

        const title = document.createElement("span");
        title.className = "history-title";
        title.textContent = session.title;

        const date = document.createElement("span");
        date.className = "history-date";
        date.textContent = getConversationDate(session.date);

        button.appendChild(title);
        button.appendChild(date);

        button.addEventListener("click", () => {
            openConversation(session.sessionId);
        });

        historyList.appendChild(button);
    });
}

// ==========================================
// OPEN SAVED CONVERSATION
// ==========================================

async function openConversation(selectedSessionId) {
    if (!currentUser || !selectedSessionId) return;

    try {
        clearChat();

        sessionId = selectedSessionId;
        isNewChat = false;

        setChatStatus("Loading previous conversation...");

        renderHistorySidebar();

        const headers = await getAuthHeaders();

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(currentUser.uid)}/${encodeURIComponent(selectedSessionId)}`,
            {
                method: "GET",
                headers
            }
        );

        if (!response.ok) {
            throw new Error(`Session history error: ${response.status}`);
        }

        const data = await response.json();

        let messages = getConversationArray(data);

        // Support a single object response if the backend returns one.
        if (messages.length === 0 && data.user_message) {
            messages = [data];
        }

        messages.sort((a, b) => {
            return getTimestamp(a.created_at) -
                   getTimestamp(b.created_at);
        });

        if (messages.length === 0) {
            addMessage("This conversation has no messages yet.", "bot");
        }

        messages.forEach(conversation => {
            if (conversation.user_message) {
                addMessage(conversation.user_message, "user");
            }

            if (conversation.assistant_response) {
                addMessage(conversation.assistant_response, "bot");
            }
        });

        setChatStatus("Continuing previous conversation");

    } catch (error) {
        console.error("Unable to open conversation:", error);

        addMessage(
            "Unable to load this conversation. Please try again.",
            "bot"
        );

        setChatStatus("Unable to load conversation");
    }
}

// ==========================================
// NEW CHAT
// ==========================================

function startNewChat() {
    sessionId = null;
    isNewChat = true;

    clearChat();
    showWelcomeMessage();

    setChatStatus("New conversation");

    renderHistorySidebar();

    if (userInput) {
        userInput.value = "";
        userInput.focus();
    }

    console.log("Started a new Ven conversation.");
}

if (newChatBtn) {
    newChatBtn.addEventListener("click", startNewChat);
}

// ==========================================
// CBT FALLBACK RESPONSES
// ==========================================

function getReply(text) {
    const message = text.toLowerCase();

    if (
        message.includes("suicide") ||
        message.includes("kill myself") ||
        message.includes("hurt myself") ||
        message.includes("self harm") ||
        message.includes("killing myself")
    ) {
        return "I'm really sorry you're experiencing such intense feelings. Please don't face this alone. Reach out to someone you trust or a mental-health professional right now. If you feel you may be in immediate danger, call 112 in India or go to the nearest emergency department. If possible, stay with someone who can support you.";
    }

    if (
        message.includes("stress") ||
        message.includes("stressed") ||
        message.includes("exam")
    ) {
        return "I hear that you're feeling stressed. 🌿 Let's slow things down. Take one slow breath and try to focus only on the next small task you can manage.";
    }

    if (
        message.includes("anxious") ||
        message.includes("anxiety") ||
        message.includes("worried") ||
        message.includes("worry")
    ) {
        return "It sounds like you're dealing with a lot of worry. Try noticing the thought that is making you anxious and ask yourself: 'Is this thought definitely true, or is there another way to look at it?'";
    }

    if (
        message.includes("sad") ||
        message.includes("depressed") ||
        message.includes("down")
    ) {
        return "I'm sorry you're having a difficult moment. 💜 Your feelings are important. Try being kind to yourself and think of one small activity that usually gives you some comfort.";
    }

    if (
        message.includes("happy") ||
        message.includes("good") ||
        message.includes("great")
    ) {
        return "I'm glad you're feeling good today! 😊 Take a moment to notice what contributed to this feeling.";
    }

    if (
        message.includes("tired") ||
        message.includes("sleep") ||
        message.includes("exhausted")
    ) {
        return "It sounds like your mind or body may need some rest. 🌙 Consider taking a short break and following a calm bedtime routine.";
    }

    if (
        message.includes("lonely") ||
        message.includes("alone")
    ) {
        return "Feeling lonely can be difficult. You don't have to handle everything by yourself. Consider reaching out to someone you trust, even with a simple message.";
    }

    if (
        message.includes("negative") ||
        message.includes("overthink") ||
        message.includes("overthinking")
    ) {
        return "When thoughts keep repeating, try writing the thought down. Then ask: 'What evidence supports this thought?' and 'What evidence might not support it?' This can help create a more balanced perspective.";
    }

    if (
        message.includes("relax") ||
        message.includes("calm") ||
        message.includes("breath")
    ) {
        return "Let's create a calm moment. 🌿 Take a slow breath in, and gently breathe out. You can also open the Guided Breathing exercise from your dashboard.";
    }

    return "Thank you for sharing that with me. 🌿 What you're feeling is worth paying attention to. Would you like to explore what happened, what you're thinking, or how you're feeling right now?";
}

// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage(messageText = null) {
    const message = typeof messageText === "string"
        ? messageText.trim()
        : userInput.value.trim();

    if (!message) return;

    if (!currentUser) {
        addMessage("Please log in to use Ven.", "bot");
        return;
    }

    if (sendBtn) {
        sendBtn.disabled = true;
    }

    addMessage(message, "user");

    if (userInput) {
        userInput.value = "";
    }

    const thinkingMessage = document.createElement("div");
    thinkingMessage.className = "message bot";

    const thinkingText = document.createElement("div");
    thinkingText.className = "message-text";
    thinkingText.textContent = "Ven is thinking...";

    thinkingMessage.appendChild(thinkingText);
    chatBox.appendChild(thinkingMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const headers = await getAuthHeaders();

        headers["Content-Type"] = "application/json";

        const response = await fetch(API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({
                message,
                session_id: sessionId
            })
        });

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error(
                `Backend returned invalid JSON. HTTP ${response.status}`
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error || data.message || `HTTP ${response.status}`
            );
        }

        if (data.session_id) {
            sessionId = data.session_id;
            isNewChat = false;
        }

        thinkingMessage.remove();

        let reply = data.reply || "";

        if (
            !reply.trim() ||
            reply.trim().toLowerCase() === message.toLowerCase()
        ) {
            reply = getReply(message);
        }

        addMessage(reply, "bot");

        setChatStatus("Conversation active");

        // Refresh sidebar so this conversation appears.
        await loadConversationHistory();

        renderHistorySidebar();

    } catch (error) {
        console.error("Ven chatbot error:", error);

        thinkingMessage.remove();

        addMessage(
            "I'm having trouble connecting right now. Please try again.",
            "bot"
        );

    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
        }
    }
}

// ==========================================
// SEND BUTTON
// ==========================================

if (sendBtn) {
    sendBtn.addEventListener("click", () => {
        sendMessage();
    });
}

// ==========================================
// ENTER KEY
// ==========================================

if (userInput) {
    userInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
}

// ==========================================
// QUICK BUTTONS
// ==========================================

quickButtons.forEach(button => {
    button.addEventListener("click", () => {
        sendMessage(button.textContent.trim());
    });
});

// ==========================================
// VOICE INPUT
// ==========================================

let recognition;
let isListening = false;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition && voiceBtn) {
    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn.addEventListener("click", () => {
        if (isListening) {
            recognition.stop();
            isListening = false;
            voiceBtn.textContent = "🎤";
            return;
        }

        isListening = true;
        voiceBtn.textContent = "🔴";

        try {
            recognition.start();
        } catch (error) {
            console.error("Voice input error:", error);

            isListening = false;
            voiceBtn.textContent = "🎤";
        }
    });

    recognition.onresult = event => {
        const speech =
            event.results[event.results.length - 1][0].transcript;

        if (userInput) {
            userInput.value = speech;
        }

        sendMessage(speech);
    };

    recognition.onerror = event => {
        console.error("Speech recognition error:", event.error);

        isListening = false;
        voiceBtn.textContent = "🎤";
    };

    recognition.onend = () => {
        isListening = false;
        voiceBtn.textContent = "🎤";
    };
}

// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(auth, async user => {
    currentUser = user;

    if (user) {
        console.log("User logged in. Loading Ven history...");

        await loadConversationHistory();

        // Start with a new chat screen.
        // Saved chats remain available in the sidebar.
        startNewChat();

    } else {
        sessionId = null;
        isNewChat = true;
        historySessions = [];

        clearChat();

        if (historyList) {
            historyList.innerHTML =
                '<p class="history-empty">Please log in to view previous chats.</p>';
        }

        showWelcomeMessage();

        setChatStatus("Please log in");
    }
});
// ==========================================
// TOGGLE PREVIOUS CHATS SIDEBAR
// ==========================================

const historyToggle = document.getElementById("historyToggle");
const chatSidebar = document.querySelector(".chat-sidebar");

if (historyToggle && chatSidebar) {
    historyToggle.addEventListener("click", () => {
        chatSidebar.classList.toggle("open");
    });
}

// Close sidebar after selecting a conversation
function closeHistorySidebar() {
    if (chatSidebar) {
        chatSidebar.classList.remove("open");
    }
}