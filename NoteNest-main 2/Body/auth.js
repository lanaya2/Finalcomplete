// Body/auth.js

let currentUser = null;

// Simple TWU email pattern: anything@something.twu.edu
const twuPattern = /^[^@\s]+@([a-zA-Z0-9-]+\.)*twu\.edu$/;

// Check if email is a valid TWU email
export function validateEmail(email) {
  if (!email) return false;
  return twuPattern.test(email);
}

// Save logged-in user info
export function setUser(user) {
  currentUser = user;
}

// Get current user
export function getUser() {
  return currentUser;
}

// Clear current user
export function clearUser() {
  currentUser = null;
}
