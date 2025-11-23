import { auth, db } from "../../main/firebase.js";
import { onAuthStateChanged, signOut }  from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const userDisplay = document.getElementById("userDisplay");
const logoutBtn   = document.getElementById("logoutBtn");

function redirectToLogin() {
  window.location.href = "login.html";
}

function redirectToStudentPortal() {
  window.location.href = "student_homepage.html";
}

function redirectToAdminPortal() {
  window.location.href = "teacher_homepage.html";
}


    if (user) {
      userId = user.uid;
      console.log("User ID stored:", userId);
    } else {
      console.log("User not logged in. Redirecting to login page.");
      logoutUser();
    }

  const uid = user.uid;
  if (userDisplay) {
    userDisplay.textContent = user.email || user.uid;
  }

  //Fetch user role
  getDoc(doc(db, "users", uid))
    .then((snap) => {
      let role = "student";
      if (snap.exists()) {
        const data = snap.data();
        role = data.role || "student";
      }

      const path = location.pathname;

      //If on admin.html but NOT admin/teacher go to student portal
      if (path.endsWith("admin.html") && role !== "admin" && role !== "teacher") {
        redirectToStudentPortal();
      }

      //If on student.html but IS admin/teacher go to admin portal
      if (path.endsWith("student.html") && (role === "admin" || role === "teacher")) {
        redirectToAdminPortal();
      }
    })
    .catch((err) => {
      console.error("Failed to load user", err);
    });

//Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        redirectToLogin();
      })
      .catch((err) => {
        console.error("Logout error", err);
      });
  });
}
