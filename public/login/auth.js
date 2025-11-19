import { auth, db } from "../main/firebase.js";
import {signInWithEmailAndPassword, onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const form = document.getElementById("loginForm");
const msg  = document.getElementById("message");


function fetchUserRole(uid) {
  return getDoc(doc(db, "users", uid)).then((snap) => {
    if (snap.exists()) {
      const data = snap.data();
      return data.role || "student"; //returns role or defaults to student on error
    }
    return "student"; // wont run, just required to complete loop
  });
}

//Redirect
function redirectByRole(role) {
  if (role === "admin" || role === "teacher") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "student_homepage.html";
  }
}

//Auto-redirect (ONLY matters on login.html)
onAuthStateChanged(auth, (user) => {
  if (!user || !form) return; // not on login page, or not logged in
  fetchUserRole(user.uid)
    .then((role) => {
      console.log("Already logged in as role:", role);
      redirectByRole(role);
    })
    .catch((err) => {
      console.error("Auto-redirect role lookup failed:", err);
    });
});

//Login
if (form) {

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        console.log("Signed in as", cred.user.email);
        const uid = cred.user.uid;
        return fetchUserRole(uid);
      })
      .then((role) => {
        redirectByRole(role);
      })
      .catch((err) => {
        console.error("Login error:", err);
        if (msg) msg.textContent = err.message || "Login failed.";
      });
  });
}

//Logout
export function logoutUser() {
  return signOut(auth)
    .then(() => {
      console.log("User logged out.");
      localStorage.removeItem("notenest.auth");
      //should redirect to public/login/login.html due to autoredirect logic written in 'redirectByRole()'
      window.location.href = "/public/login/portals/HTML/login.html";
    })
    .catch((err) => {
      console.error("Logout error:", err);
    });
}
