import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { db, auth } from "../main/firebase.js";
import {doc, getDoc, serverTimestamp} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
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

//Gathering and verifying quiz data
const params = new URLSearchParams(window.location.search);
const quizId = params.get("id");

let quizData = null;
let currentIndex = 0;
let score = 0;
let selectedIndex = null;

if (!quizId) {
  questionText.textContent = "No quiz ID provided.";
  nextBtn.disabled = true;
} else {
  const quizRef = doc(db, "quizzes", quizId);
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

      const title = quizData.name || "Quiz";
      quizTitle.textContent = title;
      quizSubtitle.textContent = "Answer each question, then click Next.";
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
    feedback.textContent = `Incorrect. Correct answer was option ${q.correct - 1}.`;
  }

  setTimeout(() => {
    currentIndex++;
    if (currentIndex < quizData.questions.length) {
      renderQuestion();
    } else {
      showResults();
    }
  }, 1000);
});

function showResults() {
  quizCard.style.display = "none";
  resultCard.style.display = "block";
  scoreText.textContent =
    `You scored ${score} out of ${quizData.questions.length}.`;

  const user = auth.currentUser;
  if (user) {
  const resultId = `${user.uid}_${quizId}`; //Only stores most recent attempt on quiz

  setDoc( //using the index section of firebase as a table similar to SQL
    doc(db, "quizResults", resultId),
    {
      userId: user.uid,
      userEmail: user.email || null,
      quizId,
      quizName: quizData.name || null,
      score,
      total: quizData.questions.length,
      updatedAt: serverTimestamp(), //When the test was last scored
    },
    { merge: true } //combines old + new data
  ).catch((err) => {
    console.error("Failed to save quiz result:", err);
  });
}

}
