"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredUser, getStoredToken, clearAuth, AUTH_EVENT } from "./auth";
import { resetSocket } from "./socket";

/**
 * Reactive auth hook. Reads the user/token from localStorage and re-renders
 * whenever auth state changes (login/logout) in this tab or another tab.
 *
 * NOTE: Does NOT use useRouter internally — that avoids the SSR
 * "Cannot read properties of undefined (reading 'addListener')" error.
 * The caller handles redirect after logout.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    const u = getStoredUser();
    const t = getStoredToken();
    setUser(u && t ? u : null);
    setReady(true);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  // Logout — clears storage and socket. The caller navigates to "/".
  const logout = useCallback(() => {
    clearAuth();
    resetSocket();
    // Use window.location for a hard redirect — avoids needing useRouter here
    window.location.href = "/";
  }, []);

  return { user, isAuthenticated: !!user, ready, logout };
}
