// Single source of truth for "is there an active session" — the same
// check ProtectedRoute and every authenticated fetch call gate on, so the
// header and marketing CTAs never disagree about signed-in state.
export function getApiToken() {
  return localStorage.getItem("apiToken");
}

export function isLoggedIn() {
  return Boolean(getApiToken());
}

/** Stale JWT on a protected read — same keys the pages used to clear inline. */
export function redirectToLogin() {
  localStorage.removeItem("apiToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  window.location.href = "/login";
}
