// Body/results.js

let lastResult = null;

// Save last quiz summary
export function saveResult(summary) {
  lastResult = summary;
}

// Get last quiz summary
export function getResult() {
  return lastResult;
}
