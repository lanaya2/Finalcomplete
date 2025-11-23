import {onAuthStateChanged }from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {db, auth } from "../main/firebase.js";
import {collection, getDocs, doc, getDoc, deleteDoc} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {logoutUser, redirectToUserHome } from "../login/auth.js";

const quizList   = document.getElementById("quizList");
const statusEl   = document.getElementById("status");
const homeBtn    = document.getElementById("homeBtn");
const logoutBtn  = document.getElementById("logoutBtn");
const quizSearch = document.getElementById("quizSearch");

let userRole = "student";
let allQuizzes = []; // cache of quizzes for search/filter

async function getUserRole(uid) {
  const ref  = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().role || "student";
  }
  return "student";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return logoutUser();

  userRole = await getUserRole(user.uid);
  console.log("User role:", userRole);

  loadQuizzes();
});

if (homeBtn) homeBtn.addEventListener("click", redirectToUserHome);
if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

// ---- Load Quizzes and cache them ----
function loadQuizzes() {
  statusEl.textContent = "Loading quizzes...";

  getDocs(collection(db, "quizzes"))
    .then((snapshot) => {
      allQuizzes = [];

      if (snapshot.empty) {
        quizList.innerHTML = "";
        statusEl.textContent = "No quizzes yet.";
        return;
      }

      snapshot.forEach((docSnap) => {
        const data   = docSnap.data();
        const quizId = docSnap.id;
        const name   = data.name || "(unnamed quiz)";

        allQuizzes.push({
          id: quizId,
          name,
        });
      });

      statusEl.textContent = "";
      renderQuizzes();
    })
    .catch((err) => {
      console.error("Error loading quizzes:", err);
      statusEl.textContent = "Failed to load quizzes.";
    });
}

//Show quizzes w/ optional filter
function renderQuizzes(filterText = "") {
  quizList.innerHTML = "";

  const ft = filterText.trim().toLowerCase();

  const filtered = allQuizzes.filter((q) => {
    if (!ft) return true;
    return q.name.toLowerCase().includes(ft);
  });

  if (filtered.length === 0) {
    quizList.innerHTML = "<li><span class='muted'>No quizzes match your search.</span></li>";
    return;
  }

  filtered.forEach((quiz) => {
    const li = document.createElement("li");

    //title
    const title = document.createElement("span");
    title.className = "quiz-title";
    title.textContent = quiz.name;
    li.appendChild(title);

    //btn
    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";

    //Take Quiz
    const takeBtn = document.createElement("button");
    takeBtn.className = "btn-primary";
    takeBtn.textContent = "Take Quiz";
    takeBtn.addEventListener("click", () => {
      window.location.href =
        `/public/login/portals/HTML/quiz_take.html?id=${quiz.id}`;
    });
    btnGroup.appendChild(takeBtn);

    //Delete Quiz
    if (userRole === "teacher" || userRole === "admin") {
      const delBtn = document.createElement("button");
      delBtn.className = "btn";
      delBtn.style.background = "#b91c1c";
      delBtn.style.color = "white";
      delBtn.textContent = "Delete";

      delBtn.addEventListener("click", async () => {
        if (!confirm(`Delete quiz "${quiz.name}"?`)) return;

        try {
          await deleteDoc(doc(db, "quizzes", quiz.id));
          //Remove from cache and re-render
          allQuizzes = allQuizzes.filter((q) => q.id !== quiz.id);
          renderQuizzes(quizSearch ? quizSearch.value : "");
        } catch (err) {
          console.error("Failed to delete quiz:", err);
          alert("Failed to delete quiz.");
        }
      });

      btnGroup.appendChild(delBtn);
    }

    li.appendChild(btnGroup);
    quizList.appendChild(li);
  });
}

//search input
if (quizSearch) {
  quizSearch.addEventListener("input", () => {
    renderQuizzes(quizSearch.value);
  });
}