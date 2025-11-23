// public/quiz/quiz_handler.js
import { db } from "../main/firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Expose quiz helpers globally
window.Quiz = {

  createQuiz(name, questions, ownerUid = null) {
    return addDoc(collection(db, "quizzes"), {
      name,
      questions,
      owner: ownerUid,
      createdAt: serverTimestamp(),
    });
  },

  async startQuiz(name) {
    const q = query(collection(db, "quizzes"), where("name", "==", name)); //firestore logic is weird sometimes, yes the equals should be in quotes
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn(`No quiz found with name "${name}".`);
      return;
    }

    const quizDoc = snap.docs[0];
    const data = quizDoc.data();
    const questions = data.questions || [];

    console.log(`Starting quiz: ${data.name} (id=${quizDoc.id})`);
    let score = 0;

    questions.forEach((q, index) => {
      console.log(`Q${index + 1}: ${q.question}`);
      q.options.forEach((opt, i) => {
        console.log(`  [${i}] ${opt}`);
      });
      console.log(`  Correct index: ${q.correct}`);
    });

    console.log("Quiz finished (console test only).");
  },
};
