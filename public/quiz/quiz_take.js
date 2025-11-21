import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { db, auth } from "../main/firebase.js";
import {doc, getDoc} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { logoutUser } from "../login/auth.js";

const quizTitle    = document.getElementById("quizTitle");
const quizSubtitle = document.getElementById("quizSubtitle");
const questionText = document.getElementById("questionText");
const optionsList  = document.getElementById("optionsList");
const feedback     = document.getElementById("feedback");
const nextBtn        = document.getElementById("nextBtn");

const quizCard   = document.getElementById("quizCard");
const resultCard = document.getElementById("resultCard");
const scoreText  = document.getElementById("scoreText");

const homeBtn   = document.getElementById("homeBtn");
const logoutBtn = document.getElementById("logoutBtn");
const finishBtn = document.getElementById("finishBtn");


  onAuthStateChanged(auth, (user) => {
    if (user) {
      userId = user.uid;
      console.log("User ID stored:", userId);
    } else {
      console.log("User not logged in. Redirecting to login page.");
      logoutUser();
    }
  });
// Navigation buttons
homeBtn.addEventListener("click", () => {
  window.location.href = "/public/login/portals/HTML/student_homepage.html";
});

logoutBtn.addEventListener("click", () => {
  logoutUser();
});

finishBtn.addEventListener("click", () => {
  window.location.href = "/public/login/portals/HTML/student_homepage.html";
});

// get quiz name
const params = new URLSearchParams(window.location.search);
const quizName = params.get("name");

let quizData = null;
let currentIndex = 0;
let score = 0;
let selectedIndex = null;

// Load quiz from Firestore
if (!quizName) {
  questionText.textContent = "No quiz name provided.";
  nextBtn.disabled = true;
} else {
  quizTitle.textContent = quizName;
  quizSubtitle.textContent = "Answer each question, then click Next.";

  const quizRef = doc(db, "quizzes", quizName);
  getDoc(quizRef)
    .then((snap) => {
      if (!snap.exists()) {
        questionText.textContent = "Quiz not found.";
        nextBtn.disabled = true;
        return;
      }
      quizData = snap.data();
      if (!quizData.questions || quizData.questions.length === 0) {
        questionText.textContent = "This quiz has no questions.";
        nextBtn.disabled = true;
        return;
      }
      renderQuestion();
    })
    .catch((err) => {
      console.error("Error loading quiz:", err);
      questionText.textContent = "Failed to load quiz.";
      nextBtn.disabled = true;
    });
}

// Render current question
function renderQuestion() {
  selectedIndex = null;
  feedback.textContent = "";
  nextBtn.disabled = true;

  const q = quizData.questions[currentIndex];
  questionText.textContent = `Question ${currentIndex + 1}: ${q.question}`;

  optionsList.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const li = document.createElement("li");

    const label = document.createElement("label");
    label.style.cursor = "pointer";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "quizOption";
    input.value = String(idx);
    input.style.marginRight = "6px";

    input.addEventListener("change", () => {
      selectedIndex = idx;
      nextBtn.disabled = false;
    });

    label.appendChild(input);
    label.appendChild(document.createTextNode(opt));
    li.appendChild(label);
    optionsList.appendChild(li);
  });

  // Update button label
  if (currentIndex === quizData.questions.length - 1) {
    nextBtn.textContent = "Submit Quiz";
  } else {
    nextBtn.textContent = "Next Question";
  }
}

nextBtn.addEventListener("click", () => {
  if (selectedIndex === null) return;

  const q = quizData.questions[currentIndex];
  if (q.correct === selectedIndex) {
    score++;
    feedback.textContent = "Correct!";
  } else {
    feedback.textContent = `Incorrect. Correct answer was option ${q.correct}.`;
  }

  // Brief delay before moving on
  setTimeout(() => {
    currentIndex++;
    if (currentIndex < quizData.questions.length) {
      renderQuestion();
    } else {
      showResults();
    }
  }, 500);
});

function showResults() {
  quizCard.style.display = "none";
  resultCard.style.display = "block";
  scoreText.textContent = `You scored ${score} out of ${quizData.questions.length}.`;
}


