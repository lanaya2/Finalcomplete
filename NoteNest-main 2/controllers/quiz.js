// controllers/quiz.js

import {
  initQuiz,
  answerQuestion,
  summarizeQuiz,
  loadQuizFromTxt,
  getQuestions
} from "../Body/quiz.js";

import { saveResult } from "../Body/results.js";

// Load quiz from questions.txt and answers.txt (10 random questions)
export async function startQuizFromTxt() {
  const questions = await loadQuizFromTxt();
  return questions;
}

// Start quiz if you already have a questions array
export function startQuiz(questions) {
  initQuiz(questions);
  return getQuestions();
}

// Record one answer
export function answer(questionId, choiceIndex) {
  answerQuestion(questionId, choiceIndex);
}

// Finish quiz and save result
export function finish() {
  const summary = summarizeQuiz();
  saveResult(summary);
  return summary;
}

// For UI if needed
export function getAllQuestions() {
  return getQuestions();
}
