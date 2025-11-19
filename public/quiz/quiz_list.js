import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { db, auth } from "../main/firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {collection,getDocs} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { logoutUser } from "../login/auth.js";

const quizList = document.getElementById("quizList");
const status   = document.getElementById("status");
const homeBtn    = document.getElementById("homeBtn");
const logoutBtn  = document.getElementById("logoutBtn");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      userId = user.uid;
      console.log("User ID stored:", userId);
    } else {
      console.log("User not logged in. Redirecting to login page.");
      logoutUser();
    }
  });


// Load quizzes from Firestore
status.textContent = "Loading quizzes...";

getDocs(collection(db, "quizzes"))
  .then((snapshot) => {
    if (snapshot.empty) {
      status.textContent = "No quizzes available yet.";
      return;
    }

    status.textContent = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const name = data.name || docSnap.id;

      const li = document.createElement("li");

      const span = document.createElement("span");
      span.className = "quiz-title";
      span.textContent = name;

      const btn = document.createElement("button");
      btn.className = "btn-primary";
      btn.textContent = "Take Quiz";
      btn.addEventListener("click", () => {
        const encoded = encodeURIComponent(name);
        window.location.href = `take_quiz.html?name=${encoded}`;
      });

      li.appendChild(span);
      li.appendChild(btn);
      quizList.appendChild(li);
    });
  })
  .catch((err) => {
    console.error("Error loading quizzes:", err);
    status.textContent = "Failed to load quizzes.";
  });

  //Home Button
homeBtn.addEventListener("click", () => {
  window.location.href = "/public/login/portals/HTML/student_homepage.html";
});

logoutBtn.addEventListener("click", () => {
  logoutUser();
});
