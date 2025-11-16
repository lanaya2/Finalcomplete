// main.js

import { login, logout } from "./controllers/auth.js";
import { startQuizFromTxt, answer, finish } from "./controllers/quiz.js";
import { getResult } from "./Body/results.js"; // ok if unused

// ----------------------
// General helpers
// ----------------------
function showSection(id) {
  const sections = document.querySelectorAll(".section");
  sections.forEach(sec => {
    sec.style.display = (sec.id === id) ? "block" : "none";
  });
}

function getCurrentEmail() {
  return localStorage.getItem("userEmail") || "";
}

// ----------------------
// Student data storage (per email)
// ----------------------
//
// localStorage key: "studentData"
// {
//   "bparajuli1@twu.edu": {
//      email: "bparajuli1@twu.edu",
//      name: "bparajuli1",
//      lastScore: 10,
//      lastTotal: 10,
//      lastPercent: 100,
//      bestPercent: 100,
//      attempts: 1,
//      comment: "good job"
//   },
//   ...
// }

const STUDENT_DATA_KEY = "studentData";

function loadStudentData() {
  try {
    const raw = localStorage.getItem(STUDENT_DATA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveStudentData(data) {
  try {
    localStorage.setItem(STUDENT_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

// Save a quiz summary for the current user
function saveResultForCurrentUser(summary) {
  const email = getCurrentEmail();
  if (!email) return;

  const data = loadStudentData();
  const name = email.replace(/@.*$/, "");
  const existing = data[email] || {
    email,
    name,
    attempts: 0,
    bestPercent: 0
  };

  existing.lastScore = summary.correct;
  existing.lastTotal = summary.total;
  existing.lastPercent = summary.percent;
  existing.attempts = (existing.attempts || 0) + 1;
  existing.bestPercent = Math.max(existing.bestPercent || 0, summary.percent);

  data[email] = existing;
  saveStudentData(data);
}

// Show teacher comment for the current logged-in student
function renderStudentCommentForCurrent() {
  const email = getCurrentEmail();
  const box = document.getElementById("studentCommentsList");
  if (!box || !email) return;

  const data = loadStudentData();
  const rec = data[email];

  if (rec && rec.comment) {
    box.innerHTML = `<p>${rec.comment}</p>`;
  } else {
    box.innerHTML = '<p class="muted">No comments yet.</p>';
  }
}

// ----------------------
// Teacher dashboard helpers
// ----------------------
let selectedStudentEmail = null;

function renderTeacherDashboard() {
  const listEl = document.getElementById("teacherStudentList");
  const labelEl = document.getElementById("selectedStudentLabel");
  const statsEl = document.getElementById("selectedStudentStats");
  const commentInput = document.getElementById("teacherCommentInput");
  const statusEl = document.getElementById("teacherCommentStatus");

  if (!listEl) return;

  const data = loadStudentData();
  const students = Object.values(data);

  listEl.innerHTML = "";
  selectedStudentEmail = null;
  if (labelEl) labelEl.textContent = "None";
  if (statsEl) statsEl.textContent = "";
  if (commentInput) commentInput.value = "";
  if (statusEl) statusEl.textContent = "";

  if (!students.length) {
    listEl.innerHTML = '<p class="muted">No student records yet.</p>';
    return;
  }

  students.forEach(rec => {
    const percent = rec.bestPercent || rec.lastPercent || 0;

    const row = document.createElement("div");
    row.className = "box";
    row.style.cursor = "pointer";
    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>${rec.name}</strong>
        <span class="muted">${percent.toFixed(1)}% best</span>
      </div>
      <div class="progress"><span style="width:${Math.min(100, percent)}%"></span></div>
    `;

    row.addEventListener("click", () => {
      selectedStudentEmail = rec.email;

      if (labelEl) labelEl.textContent = rec.email;
      if (statsEl) {
        const lastPercent = rec.lastPercent || 0;
        statsEl.innerHTML =
          `Last score: ${rec.lastScore || 0}/${rec.lastTotal || 0} `
          + `(${lastPercent.toFixed(1)}%). `
          + `Attempts: ${rec.attempts || 1}.`;
      }
      if (commentInput) commentInput.value = rec.comment || "";
      if (statusEl) statusEl.textContent = "";

      // highlight selection
      Array.from(listEl.children).forEach(child => {
        child.style.borderColor = "#e9e9e9";
      });
      row.style.borderColor = "#4f46e5";
    });

    listEl.appendChild(row);
  });
}

// ----------------------
// Main
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  console.log("main.js loaded");

  const loginForm = document.getElementById("loginForm");
  const onLoginPage = !!loginForm;
  const storedEmail = localStorage.getItem("userEmail");

  // Auth guard
  if (!onLoginPage && !storedEmail) {
    window.location.href = "index.html";
    return;
  }

  // ---------- LOGIN PAGE ----------
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("email");
      const email = emailInput.value.trim();

      const ok = await login(email);
      if (ok) {
        window.location.href = "test.html";
      } else {
        alert("Please use your TWU email (example@twu.edu).");
      }
    });
    return;
  }

  // ---------- test.html (main app) ----------
  showSection("landing");

  const btnGoStudent = document.getElementById("goStudent");
  const btnGoTeacher = document.getElementById("goTeacher");
  const btnStudentQuiz = document.getElementById("goQuiz");
  const btnStudentPdfs = document.getElementById("goPdfs");
  const btnBackFromPdfs = document.getElementById("backFromPdfs");
  const btnBackFromTeacher = document.getElementById("backFromTeacher");
  const btnBackFromStudent = document.getElementById("backFromStudent");
  const btnResultsBackStudent = document.getElementById("resultsBackStudent");
  const btnResultsRetake = document.getElementById("resultsRetake");

  if (btnGoStudent) btnGoStudent.addEventListener("click", () => {
    renderStudentCommentForCurrent();
    showSection("student");
  });

  if (btnGoTeacher) btnGoTeacher.addEventListener("click", () => {
    renderTeacherDashboard();
    showSection("teacher");
  });

  if (btnStudentQuiz) btnStudentQuiz.addEventListener("click", () => showSection("quiz"));

  if (btnStudentPdfs) btnStudentPdfs.addEventListener("click", () => {
    showSection("pdfs");
  });

  if (btnBackFromPdfs) btnBackFromPdfs.addEventListener("click", () => {
    renderStudentCommentForCurrent();
    showSection("student");
  });

  if (btnBackFromTeacher) btnBackFromTeacher.addEventListener("click", () => showSection("landing"));

  if (btnBackFromStudent) btnBackFromStudent.addEventListener("click", () => showSection("landing"));

  if (btnResultsBackStudent) {
    btnResultsBackStudent.addEventListener("click", () => {
      renderStudentCommentForCurrent();
      showSection("student");
    });
  }

  if (btnResultsRetake) {
    btnResultsRetake.addEventListener("click", async () => {
      showSection("quiz");
      await setupQuizUI(); // new quiz run
    });
  }

  // ---------- LOGOUT ----------
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      await logout();
      window.location.href = "index.html";
    });
  }

  // ---------- TEACHER: SAVE COMMENT ----------
  const saveCommentBtn = document.getElementById("saveTeacherComment");
  const commentInput = document.getElementById("teacherCommentInput");
  const statusEl = document.getElementById("teacherCommentStatus");

  if (saveCommentBtn && commentInput) {
    saveCommentBtn.addEventListener("click", () => {
      if (!selectedStudentEmail) {
        alert("Please click a student on the left first.");
        return;
      }

      const text = commentInput.value.trim();
      const data = loadStudentData();
      const rec = data[selectedStudentEmail] || {
        email: selectedStudentEmail,
        name: selectedStudentEmail.replace(/@.*$/, "")
      };

      rec.comment = text;
      data[selectedStudentEmail] = rec;
      saveStudentData(data);

      if (statusEl) statusEl.textContent = "Comment saved.";
    });
  }

  // ---------- QUIZ UI ----------
  const quizSection = document.getElementById("quiz");
  if (quizSection) {
    setupQuizUI();
  }

  // ---------- PDF UPLOAD / VIEW ----------
  const pdfInput = document.getElementById("pdfInput");
  const pdfList = document.getElementById("pdfList");
  const pdfFrame = document.getElementById("pdfFrame");

  if (pdfInput && pdfList && pdfFrame) {
    pdfInput.addEventListener("change", () => {
      pdfList.innerHTML = "";
      const files = Array.from(pdfInput.files || []);

      files.forEach(file => {
        const item = document.createElement("div");
        item.className = "box";
        item.textContent = file.name;

        item.addEventListener("click", () => {
          const url = URL.createObjectURL(file);
          pdfFrame.src = url;
        });

        pdfList.appendChild(item);
      });
    });
  }
});

// ----------------------
// Quiz UI helper
// ----------------------
let quizListenersAttached = false;

async function setupQuizUI() {
  const questionTextEl = document.getElementById("quizQuestionText");
  const choicesEl = document.getElementById("quizChoices");
  const prevBtn = document.getElementById("quizPrevBtn");
  const nextBtn = document.getElementById("quizNextBtn");
  const finishBtn = document.getElementById("quizFinishBtn");
  const resultsBox = document.getElementById("resultsSummary");

  if (!questionTextEl || !choicesEl || !prevBtn || !nextBtn || !finishBtn) {
    console.warn("Quiz elements missing in HTML");
    return;
  }

  let questions = [];
  try {
    questions = await startQuizFromTxt(); // 10 random questions
  } catch (err) {
    console.error("Error loading quiz txt files", err);
    questionTextEl.textContent = "Error loading quiz.";
    return;
  }

  if (!questions.length) {
    questionTextEl.textContent = "No quiz questions found.";
    return;
  }

  let currentIndex = 0;
  const answered = new Set(); // question IDs that have been answered

  function updateFinishEnabled() {
    const allAnswered = answered.size === questions.length;
    const onLastQuestion = currentIndex === questions.length - 1;
    finishBtn.disabled = !(allAnswered && onLastQuestion);
  }

  function renderQuestion() {
    const q = questions[currentIndex];
    questionTextEl.textContent = `Q${currentIndex + 1} of ${questions.length}: ${q.text}`;

    choicesEl.innerHTML = "";
    q.choices.forEach((choiceText, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.style.display = "block";
      btn.style.marginBottom = "8px";
      btn.textContent = choiceText;

      btn.addEventListener("click", () => {
        answer(q.id, idx);
        answered.add(q.id);

        Array.from(choicesEl.children).forEach(child => {
          child.style.opacity = "0.6";
        });
        btn.style.opacity = "1";

        updateFinishEnabled();
      });

      choicesEl.appendChild(btn);
    });

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === questions.length - 1;
    updateFinishEnabled();
  }

  if (!quizListenersAttached) {
    prevBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
      }
    });

    finishBtn.addEventListener("click", () => {
      if (finishBtn.disabled) return;

      const summary = finish();
      saveResultForCurrentUser(summary);

      if (resultsBox) {
        resultsBox.innerHTML =
          `<p><strong>Your Score:</strong> ${summary.correct}/${summary.total}
           (${summary.percent.toFixed(1)}%)</p>
           <p>Correct: ${summary.correct}, Incorrect: ${summary.incorrect}</p>`;
      }
      showSection("results");
    });

    quizListenersAttached = true;
  }

  finishBtn.disabled = true;
  renderQuestion();
}
