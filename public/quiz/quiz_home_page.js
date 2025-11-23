import { onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "../main/firebase.js";
import { logoutUser, redirectToUserHome } from "../login/auth.js";
import "./quiz_handler.js"; // defines window.Quiz

const quizNameInput      = document.getElementById("quizName");
const questionTextInput  = document.getElementById("questionText");
const optionsTextInput   = document.getElementById("optionsText");
const correctIndexInput  = document.getElementById("correctIndex");
const addQuestionBtn     = document.getElementById("addQuestionBtn");
const saveQuizBtn        = document.getElementById("saveQuizBtn");
const builderMessage     = document.getElementById("builderMessage");
const questionsPreview   = document.getElementById("questionsPreview");
const startQuizNameInput = document.getElementById("startQuizName");
const startQuizBtn       = document.getElementById("startQuizBtn");
const logoutBtn          = document.getElementById("logoutBtn");
const homeBtn            = document.getElementById("homeBtn");

const builderQuestions = [];
let userId = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    console.log("User ID stored:", userId);
  } else {
    console.log("User not logged in. Redirecting to login page.");
    logoutUser();
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logoutUser();
  });
}
if (homeBtn) {
  homeBtn.addEventListener("click", () => {
    redirectToUserHome();
  });
}

//Quiz builder preview
function renderPreview() {
  questionsPreview.innerHTML = "";
  builderQuestions.forEach((q, index) => {
    const li = document.createElement("li");
    li.textContent = `${q.question} (correct: option ${q.correct})`;
    questionsPreview.appendChild(li);
  });
}

//Add question
addQuestionBtn.addEventListener("click", () => {
  const question = questionTextInput.value.trim();
  const optionsLines = optionsTextInput.value
    .split("\n")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  const correctIndex = parseInt(correctIndexInput.value, 10);

  if (!question) {
    builderMessage.textContent = "Please enter a question.";
    return;
  }
  if (optionsLines.length < 2) {
    builderMessage.textContent = "Please enter at least two options.";
    return;
  }
  if (
    Number.isNaN(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= optionsLines.length
  ) {
    builderMessage.textContent =
      `Correct option index must be between 0 and ${optionsLines.length - 1}.`;
    return;
  }

  builderQuestions.push({
    question,
    options: optionsLines,
    correct: correctIndex,
  });

  questionTextInput.value = "";
  optionsTextInput.value = "";
  correctIndexInput.value = 0;
  builderMessage.textContent = `Added question #${builderQuestions.length}.`;

  renderPreview();
});

//Save quiz to Firestore using window.Quiz
saveQuizBtn.addEventListener("click", () => {
  const name = quizNameInput.value.trim();
  if (!name) {
    builderMessage.textContent = "Please enter a quiz name.";
    return;
  }
  if (builderQuestions.length === 0) {
    builderMessage.textContent = "Add at least one question before saving.";
    return;
  }

  builderMessage.textContent = "Saving quiz...";

  window.Quiz.createQuiz(name, builderQuestions)
    .then(() => {
      builderMessage.textContent = `Quiz "${name}" saved successfully.`;
    })
    .catch((err) => {
      console.error(err);
      builderMessage.textContent = err.message || "Failed to save quiz.";
    });
});

// console test (DEVTOOL)
startQuizBtn.addEventListener("click", () => {
  const name = startQuizNameInput.value.trim();
  if (!name) {
    return;
  }

  console.log("Starting quiz:", name);
  window.Quiz.startQuiz(name)
    .then(() => {
      console.log("Quiz started and ran (see console for questions).");
    })
    .catch((err) => {
      console.error("Failed to start quiz:", err);
    });
});
