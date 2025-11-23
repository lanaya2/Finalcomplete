import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { db, auth } from "../main/firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { logoutUser, redirectToUserHome } from "../login/auth.js";

const quizTitle    = document.getElementById("quizTitle");
const quizSubtitle = document.getElementById("quizSubtitle");
const questionText = document.getElementById("questionText");
const optionsList  = document.getElementById("optionsList");
const feedback     = document.getElementById("feedback");
const nextBtn      = document.getElementById("nextBtn");

const quizCard   = document.getElementById("quizCard");
const resultCard = document.getElementById("resultCard");
const scoreText  = document.getElementById("scoreText");

const homeBtn   = document.getElementById("homeBtn");
const logoutBtn = document.getElementById("logoutBtn");
const finishBtn = document.getElementById("finishBtn");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("User not logged in. Redirecting to login page.");
    logoutUser();
  }
});

// r(ole aware)
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

if (finishBtn) {
  finishBtn.addEventListener("click", () => {
    redirectToUserHome();
  });
}


// get quiz name
const params = new URLSearchParams(window.location.search);
const quizName = params.get("name");

let quizData = null;
let currentIndex = 0;
let score = 0;
let selectedIndex = null;

if (!quizName) {
  questionText.textContent = "No quiz name provided.";
  nextBtn.disabled = true;
} else {
  quizTitle.textContent = quizName;
  quizSubtitle.textContent = "Answer each question and click Next.";

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

function renderQuestion() {
  selectedIndex = null;
  feedback.textContent = "";
  nextBtn.disabled = true;

  const q = quizData.questions[currentIndex];
  questionText.textContent = `Question ${currentIndex + 1}: ${q.question}`;

  optionsList.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const list = document.createElement("list");
    const label = document.createElement("label");
    label.style.cursor = "pointer";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "quizOption";
    input.value = String(idx);
    input.style.marginRight = "6px";

    input.addEventlistener("change", () => {
      selectedIndex = idx;
      nextBtn.disabled = false;
    });

    label.appendChild(input);
    label.appendChild(document.createTextNode(opt));
    list.appendChild(label);
    optionslistst.appendChild(list);
  });

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

  //add time bewteen each question
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
