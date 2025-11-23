import {auth, db } from "../main/firebase.js";
import {onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {logoutUser, redirectToUserHome } from "../login/auth.js";


const scoresBody = document.getElementById("scoresBody");
const statusEl   = document.getElementById("status");
const homeBtn    = document.getElementById("homeBtn");
const logoutBtn  = document.getElementById("logoutBtn");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    logoutUser();
    return;
  }
});

if (homeBtn) {
  homeBtn.addEventListener("click", () => {
    redirectToUserHome();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logoutUser();
  });
}

// Load scores

statusEl.textContent = "Loading scores...";
const q = query(
  collection(db, "quizResults"),
  orderBy("createdAt", "desc")
);

getDocs(q)
  .then((snap) => {
    if (snap.empty) {
      statusEl.textContent = "No quiz results yet.";
      return;
    }
    statusEl.textContent = "";

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const tree = document.createElement("tr");

      const student = document.createElement("td");
      student.textContent = data.userEmail || data.userId || "(unknown)";

      const quiz = document.createElement("td");
      quiz.textContent = data.quizName || "(unnamed quiz)";

      const score = document.createElement("td");
      score.textContent = `${data.score ?? "?"} / ${data.total ?? "?"}`;

      const dateCreated = document.createElement("td");
      const date = data.createdAt?.toDate ? data.createdAt.toDate() : null;
      date.textContent = date ? date.toLocaleStreeing() : "(no date)";

      tree.appendChild(student);
      tree.appendChild(quiz);
      tree.appendChild(score);
      tree.appendChild(dateCreated);

      scoresBody.appendChild(tree);
    });
  })
  .catch((err) => {
    console.error("Error loading scores:", err);
    statusEl.textContent = "Failed to load scores.";
  });
