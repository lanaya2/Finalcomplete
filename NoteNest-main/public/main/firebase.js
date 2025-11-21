import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGNRxsLdM4LXEiC0G5-6V2hyrY7OJj5iU",
  authDomain: "note-nest-ec7a5.firebaseapp.com",
  projectId: "note-nest-ec7a5",
  storageBucket: "note-nest-ec7a5.firebasestorage.app",
  messagingSenderId: "721649110243",
  appId: "1:721649110243:web:9a2b2abfa0b4300bdf49d6",
  measurementId: "G-5XGBG7QBDR"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
