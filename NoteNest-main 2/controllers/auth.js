// controllers/auth.js

import { validateEmail, setUser, clearUser } from "../Body/auth.js";

// Check email and log the user in
export async function login(email) {
  const ok = validateEmail(email);

  if (ok) {
    const user = { email };
    setUser(user);

    // Also remember in localStorage for page navigation
    try {
      localStorage.setItem("userEmail", email);
    } catch (e) {
      // ignore storage errors
    }
  }

  return ok;
}

// Log the user out
export async function logout() {
  clearUser();
  try {
    localStorage.removeItem("userEmail");
  } catch (e) {
    // ignore
  }
}
