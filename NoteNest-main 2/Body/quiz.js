// Body/quiz.js

// Bank holds all quiz questions and the student's answers
// questions: [{ id, text, choices: [], answerIndex }]
let bank = {
  questions: [],
  answers: new Map()
};

// Initialize quiz with a questions array
export function initQuiz(questions) {
  bank.questions = Array.isArray(questions) ? questions : [];
  bank.answers = new Map();
}

// Record answer for one question
export function answerQuestion(questionId, choiceIndex) {
  bank.answers.set(questionId, choiceIndex);
}

// Return all questions (for UI)
export function getQuestions() {
  return bank.questions;
}

// Make a summary of the quiz results
export function summarizeQuiz() {
  let correct = 0;

  for (const q of bank.questions) {
    const userChoice = bank.answers.get(q.id);
    if (userChoice === q.answerIndex) {
      correct++;
    }
  }

  const total = bank.questions.length;
  const incorrect = total - correct;
  const percent = total ? (correct / total) * 100 : 0;

  return { correct, incorrect, total, percent };
}

// ------------------------
// Load questions from .txt
// ------------------------
// questions.txt lines like:
// 1|Question text|ChoiceA|ChoiceB|ChoiceC|ChoiceD
//
// answers.txt lines like:
// 1|2   (question id | correct choice index)
export async function loadQuizFromTxt() {
  const qText = await fetch("questions.txt").then(r => r.text());
  const aText = await fetch("answers.txt").then(r => r.text());

  const questionLines = qText.split("\n").map(l => l.trim()).filter(Boolean);
  const answerLines = aText.split("\n").map(l => l.trim()).filter(Boolean);

  // Build map: id -> correct index
  const answerMap = new Map();
  for (const line of answerLines) {
    const [idStr, ansStr] = line.split("|");
    const id = Number(idStr);
    const answerIndex = Number(ansStr);
    answerMap.set(id, answerIndex);
  }

  // Build question objects
  const allQuestions = questionLines.map(line => {
    const parts = line.split("|");
    const id = Number(parts[0]);
    const text = parts[1];
    const choices = parts.slice(2);
    const answerIndex = answerMap.get(id) ?? 0;
    return { id, text, choices, answerIndex };
  });

  // Pick up to 10 random questions
  const selected = pickRandom(allQuestions, 10);

  initQuiz(selected);
  return selected;
}

// Helper: pick N random items from array
function pickRandom(arr, count) {
  const copy = [...arr];
  const result = [];
  while (copy.length && result.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}
