import {auth, db } from "../main/firebase.js";
import {signInWithEmailAndPassword, onAuthStateChanged, signOut,} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const form = document.getElementById("loginForm");
const msg  = document.getElementById("message");


//fetches user data for any function that calls this script
function fetchUserRole(uid) {
  return getDoc(doc(db, "users", uid)).then((snap) => {
    if (snap.exists()) {
      const data = snap.data();
      return data.role || "student";
    }
    return "student";
  });
}


function redirectByRole(role) {
  if (role === "admin" || role === "teacher") {
    window.location.href = "/public/login/portals/HTML/teacher_homepage.html";
  } else {
    window.location.href = "/public/login/portals/HTML/student_homepage.html";
  }
}

//login redirect
export function redirectToLogin() {
  window.location.href = "/public/login/portals/HTML/login.html";
}

//role aware Home redirect
export function redirectToUserHome() {
  const user = auth.currentUser;

  if (!user) {
    redirectToLogin();
    return;
  }

  fetchUserRole(user.uid)
    .then((role) => {
      redirectByRole(role);
    })
    .catch((err) => {
      console.error("Error determining user role:", err);
      redirectToLogin();
    });
}


if (form) {
  // If already logged in, auto-redirect based on role
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserRole(user.uid)
        .then((role) => {
          redirectByRole(role);
        })
        .catch((err) => {
          console.error("Auto redirect role lookup failed:", err);
        });
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
      .then((cred) => fetchUserRole(cred.user.uid))
      .then((role) => {
        redirectByRole(role);
      })
      .catch((err) => {
        console.error("Login error:", err);
        if (msg) msg.textContent = err.message || "Login failed.";
      });
  });
}

// --- Logout ---

export function logoutUser() {
  return signOut(auth)
    .then(() => {
      console.log("User logged out.");
      localStorage.removeItem("notenest.auth");
      redirectToLogin();
    })
    .catch((err) => {
      console.error("Logout error:", err);
    });
}
