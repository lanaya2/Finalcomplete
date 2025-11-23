import {onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {collection, query, where, getDocs, addDoc, serverTimestamp} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { auth, db } from "../main/firebase.js";
import { logoutUser, redirectToUserHome } from "../login/auth.js";


const messagesDiv   = document.getElementById("messages");
const inboxStatus   = document.getElementById("inboxStatus");
const messageForm   = document.getElementById("messageForm");
const toEmailInput  = document.getElementById("toEmail");
const subjectInput  = document.getElementById("subject");
const bodyInput     = document.getElementById("body");
const messageStatus = document.getElementById("messageStatus");
const homeBtn       = document.getElementById("homeBtn");
const logoutBtn     = document.getElementById("logoutBtn");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    logoutUser();
    return;
  }
  currentUser = user;
  loadInbox(user);
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

function loadInbox(user) {
  inboxStatus.textContent = "Loading messages...";

  const q = query(
    collection(db, "messages"),
    where("toUid", "==", user.uid)
  );

  getDocs(q)
    .then((snap) => {
      messagesDiv.innerHTML = "";
      if (snap.empty) {
        inboxStatus.textContent = "No messages.";
        return;
      }
      inboxStatus.textContent = "";

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.className = "message";

        const fromEl = document.createElement("div");
        fromEl.className = "from";
        fromEl.textContent = data.fromEmail || "(unknown sender)";

        const subjectEl = document.createElement("div");
        subjectEl.className = "subject";
        subjectEl.textContent = data.subject || "(no subject)";

        const bodyEl = document.createElement("div");
        bodyEl.textContent = data.body || "";

        const dateEl = document.createElement("div");
        dateEl.className = "muted";
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : null;
        dateEl.textContent = date ? date.toLocaleString() : "";

        div.appendChild(fromEl);
        div.appendChild(subjectEl);
        div.appendChild(bodyEl);
        div.appendChild(dateEl);

        messagesDiv.appendChild(div);
      });
    })
    .catch((err) => {
      console.error("Failed to load messages:", err);
      inboxStatus.textContent = "Failed to load messages.";
    });
}

// Send message
if (messageForm) {
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentUser) {
      messageStatus.textContent = "You must be logged in.";
      return;
    }

    const toEmail = toEmailInput.value.trim();
    const subject = subjectInput.value.trim();
    const body    = bodyInput.value.trim();

    if (!toEmail || !subject || !body) {
      messageStatus.textContent = "Fill in all fields.";
      return;
    }

    messageStatus.textContent = "Sending...";

    // Look up recipient user by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", toEmail));

    getDocs(q)
      .then((snap) => {
        if (snap.empty) {
          messageStatus.textContent = "No user found with that email.";
          return;
        }

        const userDoc = snap.docs[0];
        const toUid = userDoc.id;

        return addDoc(collection(db, "messages"), {
          toUid,
          toEmail,
          fromUid: currentUser.uid,
          fromEmail: currentUser.email || null,
          subject,
          body,
          createdAt: serverTimestamp(),
        });
      })
      .then((res) => {
        if (!res) return; //means previous step failed
        messageStatus.textContent = "Message sent!";
        subjectInput.value = "";
        bodyInput.value = "";
      })
      .catch((err) => {
        console.error("Failed to send message:", err);
        messageStatus.textContent = "Failed to send message.";
      });
  });
}
