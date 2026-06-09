import axios from "axios";
import { getStoredToken, clearAuth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — clear auth and redirect to home
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const updateProfile = (data) => api.put("/auth/profile", data);

// ─── Documents ────────────────────────────────────────────────────────────────
export const fetchDocuments = () => api.get("/documents");
export const createDocument = (data) => api.post("/documents", data);
export const fetchDocument = (id) => api.get(`/documents/${id}`);
export const updateDocument = (id, data) => api.put(`/documents/${id}`, data);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

// ─── Collaborators / Sharing ──────────────────────────────────────────────────
export const addCollaborator = (docId, data) =>
  api.post(`/documents/${docId}/collaborators`, data);
export const removeCollaborator = (docId, userId) =>
  api.delete(`/documents/${docId}/collaborators/${userId}`);

// Invite a user (by email) and assign them a role ("view" | "edit").
// The request interceptor above attaches the Bearer token automatically.
export const shareDocument = (docId, data) =>
  api.put(`/documents/${docId}/share`, data);

// ─── Version History ──────────────────────────────────────────────────────────
export const restoreVersion = (docId, versionId) =>
  api.post(`/documents/${docId}/restore/${versionId}`);

// ─── Comments — available to all roles (owner, editor, viewer) ───────────────
// Persists a comment to MongoDB. The socket broadcast is handled separately
// by the server after saving, so all connected users get it live.
export const addComment = (docId, data) =>
  api.post(`/documents/${docId}/comments`, data);

// ─── Notifications ────────────────────────────────────────────────────────────
export const fetchNotifications = () => api.get("/auth/notifications");
export const markNotificationsRead = (ids) =>
  api.put("/auth/notifications/read", ids ? { ids } : {});
export const clearReadNotifications = () => api.delete("/auth/notifications");

export default api;
