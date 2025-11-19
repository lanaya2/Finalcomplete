import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth, db } from "../main/firebase.js";
import {doc, setDoc, getDoc} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { logoutUser } from "../login/auth.js";
const Quiz = (() => {
  let currentQuiz = null;  // current quiz data
  let currentIndex = 0;    // question index
  let score = 0;           // user score
  let userId = "";         // current user's UID

  onAuthStateChanged(auth, (user) => {
    if (user) {
      userId = user.uid;
      console.log("User ID stored:", userId);
    } else {
      console.log("User not logged in. Redirecting to login page.");
      logoutUser();
    }
  });

  // Promise is essentially awaiting the information from firebase, then executing code based off the recieved input
  function createQuiz(name, questions) {
    if (!userId) {
      return Promise.reject(
        new Error("Cannot create quiz: user not logged in yet.")
      );
    }
    if (!name) {
      return Promise.reject(new Error("Quiz name is required."));
    }
    if (!questions || questions.length == 0) {
      return Promise.reject(new Error("You must add at least one question."));
    }

    const userName = name.trim(); //trim is used to remove any extra spaces entered
    const quizRef = doc(db, "quizzes", userName);

    const quizData = {
      name: userName,
      questions,
      created: new Date().toISOString(),
      createdBy: userId,
    };

    return setDoc(quizRef, quizData)
      .then(() => {
        console.log(`Quiz "${userName}" created and saved to Firebase.`);
      });
  }

  // 3) Load a quiz from Firestore
  function loadQuiz(name) {
    if (!name) {
      return Promise.reject(new Error("Quiz name is required."));
    }

    const userName = name.trim();//same as last if statement
    const quizRef = doc(db, "quizzes", userName);

    return getDoc(quizRef)
      .then((snap) => {
        if (!snap.exists()) {
          throw new Error(`Quiz "${userName}" not found in Firebase.`);
        }

        currentQuiz = snap.data();
        currentIndex = 0;
        score = 0;

        console.log(`Loaded quiz: ${userName}`);

        return loadUserProgress(currentQuiz.name);
      });
  }

  // 4) Load user progress (currentIndex & score)
  function loadUserProgress(quizName) {
    if (!userId) {
      // If user not set yet, just resolve immediately
      return Promise.resolve();
    }

    const progressRef = doc(db, "userProgress", userId, "quizzes", quizName);

    return getDoc(progressRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        currentIndex = data.currentIndex || 0;
        score = data.score || 0;
        console.log("User progress loaded:", data);
      } else {
        console.log("No previous progress, initializing...");
        return initializeUserProgress(quizName);
      }
    });
  }

  function initializeUserProgress(quizName) {
    const progressRef = doc(db, "userProgress", userId, "quizzes", quizName);
    return setDoc(progressRef, {
      currentIndex: 0,
      score: 0,
    }).then(() => {
      console.log("User progress initialized.");
    });
  }

  function saveUserProgress() {
    if (!userId || !currentQuiz) {
      return Promise.resolve();
    }

    const progressRef = doc(
      db,
      "userProgress",
      userId,
      "quizzes",
      currentQuiz.name
    );

    return setDoc(
      progressRef,
      { currentIndex, score },
      { merge: true }
    ).then(() => {
      console.log("User progress saved.");
    });
  }

  // 5) Start a quiz (load + show first question)
  function startQuiz(name) {
    return loadQuiz(name).then(() => {
      showQuestion();
    });
  }

  // 6) Show current question (hook up to DOM later)
  function showQuestion() {
    if (!currentQuiz) {
      console.error("No quiz loaded.");
      return;
    }

    const q = currentQuiz.questions[currentIndex];
    if (!q) {
      endQuiz();
      return;
    }

    console.log(`Question ${currentIndex + 1}: ${q.question}`);
    console.log("Options:", q.options);

    //TODO update the website here instead of console.log.
  }

  function submitAnswer(answerIndex) {
    if (!currentQuiz) {
      console.error("No quiz loaded.");
      return Promise.reject(new Error("No quiz loaded."));
    }
    
    if (
      currentIndex < 0 ||
      currentIndex >= currentQuiz.questions.length
    ) {
      console.error("Question index out of range.");
      return Promise.reject(new Error("Question index out of range."));
    }

    const q = currentQuiz.questions[currentIndex];

    if (q.correct === answerIndex) {
      score++;
      console.log("Correct!");
    } else {
      console.log("Incorrect.");
    }

    currentIndex++;

    return saveUserProgress().then(() => {
      if (currentIndex < currentQuiz.questions.length) {
        showQuestion();
      } else {
        return endQuiz();
      }
    });
  }

  function endQuiz() {
    console.log("Quiz completed!");
    console.log(`Your score: ${score}/${currentQuiz.questions.length}`);
    return saveUserProgress();
  }

  return {
    createQuiz,
    startQuiz,
    submitAnswer,
  };
})();

//Exposed globally so other scripts can call it
window.Quiz = Quiz;