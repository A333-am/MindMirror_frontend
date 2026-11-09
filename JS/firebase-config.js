
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAGl82Qc5Qtwoolb1Wst-9RvZhceIvVOgg",
    authDomain: "mindmirror-400be.firebaseapp.com",
    projectId: "mindmirror-400be",
    storageBucket: "mindmirror-400be.firebasestorage.app",
    messagingSenderId: "240988125394",
    appId: "1:240988125394:web:a3a1e2dc9b31f8c8bc950b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
window.mindMirrorAuth = auth;