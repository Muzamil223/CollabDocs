import { io } from "socket.io-client";
import { getStoredToken } from "./auth";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket = null;

/**
 * Returns the Socket.io singleton, creating it if it doesn't exist yet.
 * The JWT token is read from localStorage and passed in the `auth` handshake.
 */
export const getSocket = () => {
  if (!socket) {
    const token = getStoredToken();

    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      auth: { token: token || "" },
      // Performance: don't buffer events when disconnected
      // (prevents a flood of stale events on reconnect)
      volatile: false,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socket.on("join-error", ({ message }) => {
      console.error("🚫 Socket join-error:", message);
    });
  }
  return socket;
};

/**
 * Connect the socket. Re-reads the JWT from localStorage before connecting
 * so reconnects after token refresh work correctly.
 */
export const connectSocket = () => {
  const s = getSocket();
  const token = getStoredToken();
  s.auth = { token: token || "" };
  if (!s.connected) s.connect();
  return s;
};

/**
 * Disconnect and destroy the singleton.
 * Call on logout so the next session gets a fresh connection.
 */
export const resetSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

export default getSocket;
