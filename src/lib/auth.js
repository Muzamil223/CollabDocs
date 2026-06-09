const USER_KEY = "collab_user";
const TOKEN_KEY = "collab_token";

export const AUTH_EVENT = "collab-auth-change";

// Notify React components (e.g. the Navbar) that auth state changed within
// the same tab. `storage` events only fire across tabs, so we dispatch our own.
const emitAuthChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const storeAuth = (user, token) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  emitAuthChange();
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  emitAuthChange();
};

export const isAuthenticated = () => {
  return !!getStoredToken() && !!getStoredUser();
};
