import {auth, db } from "../main/firebase.js";
import {onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {logoutUser, redirectToUserHome } from "../login/auth.js";

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
  if (!messagesDiv || !inboxStatus) return;

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
        const msgId = docSnap.id;

        const wrapper = document.createElement("div");
        wrapper.className = "message";
        wrapper.style.borderBottom = "1px solid #e5e7eb";
        wrapper.style.padding = ".5rem 0";

        const fromEl = document.createElement("div");
        fromEl.className = "from";
        fromEl.textContent = data.fromEmail || "(unknown sender)";

        const subjectEl = document.createElement("div");
        subjectEl.className = "subject";
        subjectEl.textContent = data.subject || "(no subject)";

        const bodyEl = document.createElement("div");
        bodyEl.textContent = data.body || "";

        const metaRow = document.createElement("div");
        metaRow.style.display = "flex";
        metaRow.style.justifyContent = "space-between";
        metaRow.style.alignItems = "center";
        metaRow.style.marginTop = ".25rem";

        const dateEl = document.createElement("div");
        dateEl.className = "muted";
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : null;
        dateEl.textContent = date ? date.toLocaleString() : "";

        //Delete button (user can delete messages)
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn";
        deleteBtn.style.background = "#b91c1c";
        deleteBtn.style.color = "#fff";
        deleteBtn.style.padding = ".2rem .6rem";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", async () => {
          const ok = confirm("Delete this message?");
          if (!ok) return;

          try {
            await deleteDoc(doc(db, "messages", msgId));
            wrapper.remove();
          } catch (err) {
            console.error("Failed to delete message:", err);
            alert("Failed to delete message.");
          }
        });

        metaRow.appendChild(dateEl);
        metaRow.appendChild(deleteBtn);

        wrapper.appendChild(fromEl);
        wrapper.appendChild(subjectEl);
        wrapper.appendChild(bodyEl);
        wrapper.appendChild(metaRow);

        messagesDiv.appendChild(wrapper);
      });
    })
    .catch((err) => {
      console.error("Failed to load messages:", err);
      inboxStatus.textContent = "Failed to load messages.";
    });
}

// ---- Send message ----
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

    // Look up recipient by email
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
        if (!res) return; // previous step failed
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
