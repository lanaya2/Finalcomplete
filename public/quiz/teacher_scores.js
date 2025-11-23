import {auth, db } from "../main/firebase.js";
import {onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {logoutUser, redirectToUserHome } from "../login/auth.js";


const scoresBody  = document.getElementById("scoresBody");
const statusEl    = document.getElementById("status");
const homeBtn     = document.getElementById("homeBtn");
const logoutBtn   = document.getElementById("logoutBtn");
const scoreSearch = document.getElementById("scoreSearch");

let allScores = []; // cache of scores: one per doc

onAuthStateChanged(auth, (user) => {
  if (!user) {
    logoutUser();
    return;
  }
  loadScores();
});

if (homeBtn) homeBtn.addEventListener("click", redirectToUserHome);
if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

//Load all quiz results into cache
function loadScores() {
  statusEl.textContent = "Loading scores...";

  getDocs(collection(db, "quizResults"))
    .then((snap) => {
      allScores = [];

      if (snap.empty) {
        scoresBody.innerHTML = "";
        statusEl.textContent = "No quiz results yet.";
        return;
      }

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        allScores.push({
          id: docSnap.id,
          student: data.userEmail || data.userId || "(unknown)",
          quiz: data.quizName || "(unnamed quiz)",
          score: data.score ?? "?",
          total: data.total ?? "?",
          ts: data.updatedAt || data.createdAt || null,
        });
      });

      // Sort newest first client-side
      allScores.sort((a, b) => {
        const ta = a.ts && a.ts.toDate ? a.ts.toDate().getTime() : 0;
        const tb = b.ts && b.ts.toDate ? b.ts.toDate().getTime() : 0;
        return tb - ta;
      });

      statusEl.textContent = "";
      renderScores(scoreSearch ? scoreSearch.value : "");
    })
    .catch((err) => {
      console.error("Error loading scores:", err);
      statusEl.textContent = "Failed to load scores.";
    });
}

function renderScores(filterText = "") {
  scoresBody.innerHTML = "";

  const ft = filterText.trim().toLowerCase();

  const filtered = allScores.filter((row) => {
    if (!ft) return true;
    return (
      row.student.toLowerCase().includes(ft) ||
      row.quiz.toLowerCase().includes(ft)
    );
  });

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No scores match your search.";
    td.className = "muted";
    tr.appendChild(td);
    scoresBody.appendChild(tr);
    return;
  }

  filtered.forEach((row) => {
    const tr = document.createElement("tr");

    const studentCell = document.createElement("td");
    studentCell.textContent = row.student;

    const quizCell = document.createElement("td");
    quizCell.textContent = row.quiz;

    const scoreCell = document.createElement("td");
    scoreCell.textContent = `${row.score} / ${row.total}`;

    const dateCell = document.createElement("td");
    if (row.ts && row.ts.toDate) {
      dateCell.textContent = row.ts.toDate().toLocaleString();
    } else {
      dateCell.textContent = "(no date)";
    }

    const actionCell = document.createElement("td");
    const clearBtn = document.createElement("button");
    clearBtn.className = "btn";
    clearBtn.style.background = "#b91c1c";
    clearBtn.style.color = "#fff";
    clearBtn.style.padding = ".2rem .6rem";
    clearBtn.textContent = "Clear";

    clearBtn.addEventListener("click", async () => {
      const ok = confirm(
        `Clear this score? (${row.student} – "${row.quiz}" – ${row.score}/${row.total})`
      );
      if (!ok) return;

      try {
        await deleteDoc(doc(db, "quizResults", row.id));
        allScores = allScores.filter((s) => s.id !== row.id);
        renderScores(scoreSearch ? scoreSearch.value : "");
      } catch (err) {
        console.error("Failed to clear score:", err);
        alert("Failed to clear score.");
      }
    });

    actionCell.appendChild(clearBtn);

    tr.appendChild(studentCell);
    tr.appendChild(quizCell);
    tr.appendChild(scoreCell);
    tr.appendChild(dateCell);
    tr.appendChild(actionCell);

    scoresBody.appendChild(tr);
  });
}

// Search listener stays the same
if (scoreSearch) {
  scoreSearch.addEventListener("input", () => {
    renderScores(scoreSearch.value);
  });
}