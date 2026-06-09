"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Save, Users, Loader2, AlertCircle, History,
  X, Crown, Eye, Pencil, RotateCcw, UserPlus, Mail,
  ShieldCheck, CheckCircle2, Send, MessageSquare,
  MessageCircle, Sun, Moon,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Download, ChevronDown, FileDown, FileText,
} from "lucide-react";
import Editor from "@/components/Editor";
import { fetchDocument, updateDocument, restoreVersion, shareDocument } from "@/lib/api";
import { getStoredUser, getStoredToken } from "@/lib/auth";
import { connectSocket } from "@/lib/socket";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { exportAsPDF, exportAsDOCX } from "@/lib/exportDocument";

const SAVE_DEBOUNCE_MS = 2000;

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role, isDark }) {
  if (role === "owner")
    return (
      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        isDark ? "bg-violet-500/15 text-violet-400 border-violet-500/25" : "bg-violet-100 text-violet-700 border-violet-300")}>
        <Crown className="w-3 h-3" /> Owner
      </span>
    );
  if (role === "edit")
    return (
      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        isDark ? "bg-pink-500/15 text-pink-400 border-pink-500/25" : "bg-pink-100 text-pink-700 border-pink-300")}>
        <Pencil className="w-3 h-3" /> Editor
      </span>
    );
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
      isDark ? "bg-zinc-700/50 text-zinc-400 border-zinc-600/50" : "bg-zinc-100 text-zinc-600 border-zinc-300")}>
      <Eye className="w-3 h-3" /> Viewer
    </span>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
      className={cn(
        "relative flex items-center w-14 h-7 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 shrink-0",
        isDark ? "bg-zinc-800 border-zinc-700 hover:border-zinc-600" : "bg-zinc-200 border-zinc-300 hover:border-zinc-400"
      )}
    >
      <span className={cn(
        "absolute flex items-center justify-center w-5 h-5 rounded-full shadow-md transition-all duration-300",
        isDark ? "translate-x-7 bg-zinc-300" : "translate-x-1 bg-white"
      )}>
        {isDark ? <Moon className="w-3 h-3 text-zinc-700" /> : <Sun className="w-3 h-3 text-amber-500" />}
      </span>
    </button>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ doc, isDark, onClose, onShared }) {
  const [email, setEmail]           = useState("");
  const [role, setRole]             = useState("view");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Please enter a valid email address."); return;
    }
    setSubmitting(true);
    try {
      const res = await shareDocument(doc._id, { email: trimmed, role });
      setSuccess(res.data?.message || "Collaborator added.");
      setEmail("");
      onShared?.(res.data?.collaborator);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add collaborator.");
    } finally { setSubmitting(false); }
  };

  const overlay   = isDark ? "bg-zinc-950/80" : "bg-zinc-900/50";
  const cardCls   = isDark ? "bg-zinc-900 border-zinc-700/80" : "bg-white border-zinc-200";
  const labelCls  = isDark ? "text-zinc-400" : "text-zinc-500";
  const optBase   = isDark ? "border-zinc-700 bg-zinc-900 hover:border-zinc-600" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300";
  const optActive = "border-violet-500/50 bg-violet-500/10 ring-2 ring-violet-500/20";

  return (
    <div
      className={cn("fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in", overlay)}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn("w-full max-w-md p-6 rounded-xl border shadow-2xl animate-slide-up", cardCls)}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className={cn("text-lg font-semibold leading-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
                Invite Collaborator
              </h2>
              <p className={cn("text-xs mt-0.5 truncate max-w-[260px]", isDark ? "text-zinc-500" : "text-zinc-400")}>
                {doc.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100")} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={cn("block text-xs font-medium mb-1.5 uppercase tracking-wider", labelCls)}>
              Invite by email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                ref={inputRef} type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="teammate@example.com"
                className={cn("w-full pl-10 pr-4 py-3 rounded-lg text-sm border transition-all duration-200 focus:outline-none focus:ring-2",
                  isDark
                    ? "bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-violet-500/70 focus:ring-violet-500/20"
                    : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-violet-500/60 focus:ring-violet-500/20")}
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <label className={cn("block text-xs font-medium mb-1.5 uppercase tracking-wider", labelCls)}>
              Permission level
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val: "view", icon: Eye, title: "Viewer", desc: "Can read only" },
                { val: "edit", icon: Pencil, title: "Editor", desc: "Can edit content" },
              ].map((opt) => (
                <button key={opt.val} type="button" onClick={() => setRole(opt.val)}
                  className={cn("flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all duration-200",
                    role === opt.val ? optActive : optBase)}>
                  <span className={cn("flex items-center gap-1.5 text-sm font-medium",
                    role === opt.val ? "text-violet-400" : isDark ? "text-zinc-200" : "text-zinc-700")}>
                    <opt.icon className="w-4 h-4" />{opt.title}
                  </span>
                  <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 animate-fade-in">
              <ShieldCheck className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-violet-400 text-sm">{success}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className={cn("flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm border transition-all duration-200",
                isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200")}
              disabled={submitting}>
              Done
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</>
                : <><UserPlus className="w-4 h-4" />Send Invite</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg, isOwn, isDark }) {
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <div className={cn("flex flex-col gap-0.5 max-w-[90%]", isOwn ? "items-end self-end" : "items-start self-start")}>
      <span className={cn("text-[10px] font-semibold tracking-wide px-1",
        isOwn ? "text-violet-500" : isDark ? "text-zinc-400" : "text-zinc-500")}>
        {isOwn ? "You" : msg.senderName}
      </span>
      <div className={cn("px-3 py-2 rounded-2xl text-sm leading-relaxed break-words max-w-full",
        isOwn
          ? isDark
            ? "bg-violet-500/20 border border-violet-500/30 text-violet-100 rounded-tr-sm"
            : "bg-violet-100 border border-violet-200 text-violet-900 rounded-tr-sm"
          : isDark
            ? "bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 rounded-tl-sm"
            : "bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-tl-sm"
      )}>
        {msg.messageText}
      </div>
      {time && (
        <span className={cn("text-[10px] px-1", isDark ? "text-zinc-600" : "text-zinc-400")}>{time}</span>
      )}
    </div>
  );
}

// ─── Comment Card ─────────────────────────────────────────────────────────────
function CommentCard({ comment, isDark }) {
  const time = (comment.createdAt || comment.timestamp)
    ? new Date(comment.createdAt || comment.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const color = comment.avatarColor || "#7C3AED";
  return (
    <div className={cn("p-3 rounded-xl border transition-all duration-200",
      isDark
        ? "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
        : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm")}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {getInitials(comment.authorName)}
        </div>
        <span className={cn("text-xs font-semibold truncate flex-1", isDark ? "text-zinc-300" : "text-zinc-700")}>
          {comment.authorName}
        </span>
        {time && (
          <span className={cn("text-[10px] shrink-0", isDark ? "text-zinc-600" : "text-zinc-400")}>{time}</span>
        )}
      </div>
      <p className={cn("text-sm leading-relaxed break-words", isDark ? "text-zinc-300" : "text-zinc-600")}>
        {comment.text}
      </p>
    </div>
  );
}

// ─── Main Document Page ───────────────────────────────────────────────────────
export default function DocumentPage() {
  const router     = useRouter();
  const params     = useParams();
  const documentId = params.id;

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState("dark");
  const isDark = theme === "dark";

  // ── Document state ─────────────────────────────────────────────────────────
  const [document, setDocument]         = useState(null);
  const [currentUser, setCurrentUser]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [saveStatus, setSaveStatus]     = useState("saved");
  const saveTimerRef                    = useRef(null);
  const pendingContentRef               = useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue]     = useState("");
  const [onlineUserIds, setOnlineUserIds]   = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers]   = useState([]);
  const [showHistory, setShowHistory]   = useState(false);
  const [showInvite, setShowInvite]     = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(null);

  // ── Sidebar collapse state ─────────────────────────────────────────────────
  const [leftOpen, setLeftOpen]   = useState(true);   // collaborators panel
  const [rightOpen, setRightOpen] = useState(true);   // chat/comments panel
  const [rightTab, setRightTab]   = useState("chat"); // "chat" | "comments"

  // ── Export state ───────────────────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting]   = useState(null); // 'pdf' | 'docx' | null
  const exportDropdownRef           = useRef(null);

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState("");
  const chatEndRef                      = useRef(null);
  const chatInputRef                    = useRef(null);

  // ── Comment state — open to ALL roles ─────────────────────────────────────
  const [comments, setComments]         = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const commentsEndRef                  = useRef(null);
  const commentInputRef                 = useRef(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Auth guard + initial load ──────────────────────────────────────────────
  useEffect(() => {
    const user  = getStoredUser();
    const token = getStoredToken();
    if (!user || !token) { router.replace("/login"); return; }
    setCurrentUser(user);
    loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, router]);

  const loadDocument = async () => {
    try {
      setLoading(true); setError("");
      const res = await fetchDocument(documentId);
      const doc = res.data.document;
      setDocument(doc);
      setTitleValue(doc.title);
      pendingContentRef.current = doc.content || "";
      // Seed persisted comments — these survive logout and page refresh
      if (Array.isArray(doc.comments) && doc.comments.length > 0) {
        setComments(
          doc.comments.map((c) => ({
            _id:         c._id,
            authorName:  c.authorName,
            avatarColor: c.avatarColor || "#7C3AED",
            text:        c.text,
            createdAt:   c.createdAt,
            id:          c._id,
          }))
        );
      }
    } catch (err) {
      if (err.response?.status === 403) setError("You do not have permission to access this document.");
      else if (err.response?.status === 404) setError("Document not found.");
      else setError("Failed to load document. Please try again.");
    } finally { setLoading(false); }
  };

  // ── Members list (owner + collaborators with live presence overlay) ────────
  const members = useMemo(() => {
    if (!document) return [];
    const list = [], seen = new Set();
    const ownerId = document.owner?._id
      ? document.owner._id.toString()
      : document.owner?.toString();
    if (document.owner && document.owner._id) {
      list.push({
        userId: ownerId,
        name: document.owner.name,
        email: document.owner.email,
        avatarColor: document.owner.avatarColor,
        role: "owner",
      });
      seen.add(ownerId);
    }
    (document.permittedCollaborators || []).forEach((c) => {
      const u = c.userId; if (!u) return;
      const id = u._id ? u._id.toString() : u.toString();
      if (seen.has(id)) return; seen.add(id);
      list.push({
        userId: id,
        name: u.name || "Unknown user",
        email: u.email || "",
        avatarColor: u.avatarColor,
        role: c.role,
      });
    });
    return list.map((m) => ({ ...m, online: onlineUserIds.includes(m.userId) }));
  }, [document, onlineUserIds]);

  const onlineCount = members.filter((m) => m.online).length;

  // ── Socket: presence + collaboration events ────────────────────────────────
  useEffect(() => {
    if (!documentId || !currentUser) return;
    const socket = connectSocket();

    const onConnect       = () => setSocketConnected(true);
    const onDisconnect    = () => setSocketConnected(false);
    const onPresence      = (users) =>
      setOnlineUserIds((users || []).map((u) => u.userId).filter(Boolean));
    const onJoinSuccess   = ({ role }) =>
      setDocument((prev) =>
        prev && role && prev.userRole !== role ? { ...prev, userRole: role } : prev
      );
    const onJoinError     = ({ message }) =>
      setError(message || "Access denied.");
    const onUserJoined    = ({ message }) => showToast(message, "info");
    const onUserLeft      = ({ message }) => showToast(message, "info");
    const onTitleUpdated  = ({ title }) => {
      setTitleValue(title);
      setDocument((prev) => prev ? { ...prev, title } : prev);
    };
    const onDocumentSaved = ({ savedBy }) => {
      if (savedBy !== currentUser.name) setSaveStatus("saved");
    };
    const onUserTyping    = ({ user, isTyping }) => {
      if (!user || user.id === currentUser.id) return;
      setTypingUsers((prev) =>
        isTyping
          ? prev.includes(user.name) ? prev : [...prev, user.name]
          : prev.filter((n) => n !== user.name)
      );
    };

    // ── Chat messages — registered here so ALL roles receive them ─────────
    const onChatMessage = ({ senderName, messageText, timestamp }) => {
      setChatMessages((prev) => [
        ...prev,
        { senderName, messageText, timestamp, id: crypto.randomUUID() },
      ]);
    };

    // ── Comments — registered here so ALL roles receive them ──────────────
    // The server broadcasts via io.to() (not socket.broadcast) so the sender
    // also receives the DB-confirmed comment with its _id. We deduplicate by
    // _id to avoid showing the optimistic copy twice.
    const onReceiveComment = ({ _id, authorName, avatarColor, text, createdAt }) => {
      setComments((prev) => {
        // Drop the optimistic placeholder that has the same text + author
        // (it won't have a real _id yet, so filter by matching text+author)
        const withoutOptimistic = prev.filter(
          (c) => !(c.optimistic && c.authorName === authorName && c.text === text)
        );
        // Also guard against duplicate DB events
        if (withoutOptimistic.some((c) => c._id === _id)) return withoutOptimistic;
        return [
          ...withoutOptimistic,
          { _id, authorName, avatarColor, text, createdAt, id: _id },
        ];
      });
    };

    socket.on("connect",         onConnect);
    socket.on("disconnect",      onDisconnect);
    socket.on("presence-update", onPresence);
    socket.on("join-success",    onJoinSuccess);
    socket.on("join-error",      onJoinError);
    socket.on("user-joined",     onUserJoined);
    socket.on("user-left",       onUserLeft);
    socket.on("title-updated",   onTitleUpdated);
    socket.on("document-saved",  onDocumentSaved);
    socket.on("user-typing",     onUserTyping);
    socket.on("receive-chat-message", onChatMessage);
    socket.on("receive-comment",      onReceiveComment);

    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect",         onConnect);
      socket.off("disconnect",      onDisconnect);
      socket.off("presence-update", onPresence);
      socket.off("join-success",    onJoinSuccess);
      socket.off("join-error",      onJoinError);
      socket.off("user-joined",     onUserJoined);
      socket.off("user-left",       onUserLeft);
      socket.off("title-updated",   onTitleUpdated);
      socket.off("document-saved",  onDocumentSaved);
      socket.off("user-typing",     onUserTyping);
      socket.off("receive-chat-message", onChatMessage);
      socket.off("receive-comment",      onReceiveComment);
    };
  }, [documentId, currentUser, showToast]);

  // ── Auto-scroll chat & comments to bottom ─────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // ── Send chat message ──────────────────────────────────────────────────────
  const sendChatMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !currentUser) return;
    const socket    = connectSocket();
    const timestamp = new Date();
    setChatMessages((prev) => [
      ...prev,
      { senderName: currentUser.name, messageText: text, timestamp, id: crypto.randomUUID(), isOwn: true },
    ]);
    socket.emit("send-chat-message", {
      docId: documentId,
      senderName: currentUser.name,
      messageText: text,
    });
    setChatInput("");
    chatInputRef.current?.focus();
  }, [chatInput, currentUser, documentId]);

  const handleChatKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  }, [sendChatMessage]);

  // ── Post a comment — available to ALL roles (editors AND viewers) ──────────
  // ── Post a comment — available to ALL roles (editors AND viewers) ──────────
  // Flow:
  // 1. Add an optimistic placeholder immediately so the UI feels instant.
  // 2. Emit socket event — the server saves to MongoDB and broadcasts the
  //    DB-confirmed comment back to EVERY socket in the room (io.to), including
  //    this one. No separate REST call needed; the socket handler does the save.
  // 3. The onReceiveComment handler deduplicates by swapping the optimistic
  //    entry for the confirmed one that carries the real DB _id.
  const postComment = useCallback(() => {
    const text = commentInput.trim();
    if (!text || !currentUser) return;

    const optimisticId = crypto.randomUUID();
    const avatarColor  = currentUser.avatarColor || "#7C3AED";

    // Optimistic local append — flagged so the dedup logic can find and replace it
    setComments((prev) => [
      ...prev,
      {
        authorName: currentUser.name,
        avatarColor,
        text,
        createdAt:  new Date().toISOString(),
        id:         optimisticId,
        optimistic: true,
      },
    ]);
    setCommentInput("");
    commentInputRef.current?.focus();

    // Emit to server — server saves to DB and broadcasts back to all sockets
    connectSocket().emit("send-comment", { docId: documentId, text });
  }, [commentInput, currentUser, documentId]);

  const handleCommentKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); }
  }, [postComment]);

  // ── Content change → debounced autosave ───────────────────────────────────
  const handleContentChange = useCallback((value) => {
    pendingContentRef.current = value;
    setSaveStatus("saving");
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateDocument(documentId, { content: value });
        setSaveStatus("saved");
        connectSocket().emit("save-document", { documentId });
      } catch { setSaveStatus("error"); }
    }, SAVE_DEBOUNCE_MS);
  }, [documentId]);

  const handleTitleSave = async () => {
    const newTitle = titleValue.trim() || "Untitled Document";
    setIsEditingTitle(false);
    if (newTitle === document?.title) return;
    try {
      await updateDocument(documentId, { title: newTitle });
      setDocument((prev) => prev ? { ...prev, title: newTitle } : prev);
      setTitleValue(newTitle);
      connectSocket().emit("title-change", { documentId, title: newTitle });
    } catch {
      showToast("Failed to save title.", "error");
      setTitleValue(document?.title || "");
    }
  };

  const handleManualSave = async () => {
    const value = pendingContentRef.current ?? document?.content ?? "";
    setSaveStatus("saving");
    try {
      await updateDocument(documentId, { content: value, saveVersion: true });
      setSaveStatus("saved");
      showToast("Version saved to history.", "success");
      connectSocket().emit("save-document", { documentId });
      loadDocument();
    } catch {
      setSaveStatus("error");
      showToast("Failed to save.", "error");
    }
  };

  const handleRestoreVersion = async (versionId) => {
    setRestoringVersion(versionId);
    try {
      const res = await restoreVersion(documentId, versionId);
      const restored = res.data.content || "";
      setDocument((prev) => prev ? { ...prev, content: restored } : prev);
      pendingContentRef.current = restored;
      connectSocket().emit("send-changes", { documentId, delta: restored });
      showToast("Document restored to selected version.", "success");
      setShowHistory(false);
      loadDocument();
    } catch { showToast("Failed to restore version.", "error"); }
    finally { setRestoringVersion(null); }
  };

  // Ctrl/Cmd+S manual save shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (canEdit) handleManualSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  // ── Click-outside: close export dropdown ──────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    window.document.addEventListener("mousedown", handleClickOutside);
    return () => window.document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canEdit = document?.userRole === "owner" || document?.userRole === "edit";
  const isOwner = document?.userRole === "owner";

  // ── Theme-aware class tokens ───────────────────────────────────────────────
  const rootBg        = isDark ? "bg-[#0A0612] text-[#F6F2FC]" : "bg-[#FBFAFF] text-[#1B1230]";
  const headerBg      = isDark ? "bg-[#0A0612]/80 border-[#2A1F44]" : "bg-white/90 border-[#ECE6F6]";
  const leftPanelBg   = isDark ? "bg-[#110A1E]/70 border-[#2A1F44]" : "bg-white border-[#ECE6F6]";
  const rightPanelBg  = isDark ? "bg-[#110A1E]/60 border-[#2A1F44]" : "bg-white border-[#ECE6F6]";
  const sectionHead   = isDark ? "text-[#6E6388]" : "text-[#9C93B2]";
  const dividerColor  = isDark ? "bg-[#2A1F44]" : "bg-[#ECE6F6]";
  const hoverRow      = isDark ? "hover:bg-[#221836]" : "hover:bg-[#F7F4FD]";
  const inputCls      = isDark
    ? "bg-[#17112A] border-[#3D2E5E] text-[#F6F2FC] placeholder-[#6E6388] focus:border-violet-500/50 focus:ring-violet-500/20"
    : "bg-[#FBFAFF] border-[#D9CEED] text-[#1B1230] placeholder-[#9C93B2] focus:border-violet-500/60 focus:ring-violet-500/20";
  const editorCardCls = isDark
    ? "border-[#2A1F44] bg-[#17112A]/50 backdrop-blur-sm shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_24px_80px_-24px_rgba(0,0,0,0.9)] focus-within:border-violet-500/40 focus-within:shadow-[0_0_0_1px_rgba(124,58,237,0.25),0_24px_80px_-24px_rgba(0,0,0,0.9)]"
    : "border-[#ECE6F6] bg-white shadow-xl focus-within:border-violet-400/60 focus-within:shadow-[0_0_0_2px_rgba(124,58,237,0.12),0_20px_60px_-12px_rgba(0,0,0,0.08)]";
  const ghostBtn      = isDark
    ? "text-[#ADA1C6] hover:text-[#F6F2FC] hover:bg-[#221836]"
    : "text-[#6A6184] hover:text-[#1B1230] hover:bg-[#F4F1FB]";

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", rootBg)}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-400")}>Loading document…</p>
        </div>
      </div>
    );
  }

  // ── Error screen ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", rootBg)}>
        <div className={cn("max-w-md w-full p-8 text-center rounded-xl border",
          isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 shadow-lg")}>
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className={cn("text-lg font-semibold mb-2", isDark ? "text-zinc-100" : "text-zinc-900")}>
            Access Error
          </h2>
          <p className={cn("text-sm mb-6", isDark ? "text-zinc-400" : "text-zinc-500")}>{error}</p>
          <button onClick={() => router.push("/dashboard")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium text-sm transition-all duration-200">
            <ArrowLeft className="w-4 h-4" />Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className={cn("h-screen flex flex-col overflow-hidden transition-colors duration-300", rootBg)}>

      {/* Ambient glow — dark mode only */}
      {isDark && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-violet-500/5 blur-[120px] rounded-full" />
        </div>
      )}

      {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
      <header className={cn(
        "relative z-30 shrink-0 h-14 border-b backdrop-blur-xl flex items-center gap-2 px-4 transition-colors duration-300",
        headerBg
      )}>
        {/* Back */}
        <button onClick={() => router.push("/dashboard")}
          className={cn("inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 focus:outline-none shrink-0", ghostBtn)}
          title="Back to Dashboard">
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Left sidebar toggle */}
        <button
          onClick={() => setLeftOpen((v) => !v)}
          className={cn("hidden lg:inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 focus:outline-none shrink-0", ghostBtn)}
          title={leftOpen ? "Hide collaborators" : "Show collaborators"}
        >
          {leftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        <div className={cn("w-px h-5 shrink-0", dividerColor)} />

        {/* Document title */}
        <div className="min-w-0 flex-1">
          {isEditingTitle && canEdit ? (
            <input
              autoFocus value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") { setTitleValue(document?.title || ""); setIsEditingTitle(false); }
              }}
              className={cn("bg-transparent border-b font-bold text-base focus:outline-none w-full max-w-sm py-0.5",
                isDark ? "border-violet-500/50 text-zinc-100" : "border-violet-500/60 text-zinc-900")}
              maxLength={200}
            />
          ) : (
            <button
              onClick={() => canEdit && setIsEditingTitle(true)}
              className={cn("font-bold text-base tracking-tight truncate block text-left max-w-full transition-colors",
                isDark ? "text-zinc-50 hover:text-violet-400" : "text-zinc-900 hover:text-violet-600",
                canEdit && "cursor-text")}
              title={canEdit ? "Click to rename" : document?.title}
            >
              {titleValue || "Untitled Document"}
            </button>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sync status */}
          <span className={cn(
            "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
            socketConnected
              ? isDark ? "bg-violet-500/10 border-violet-500/30 text-violet-400" : "bg-violet-50 border-violet-300 text-violet-600"
              : isDark ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-500"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", socketConnected ? "bg-violet-400 animate-pulse" : "bg-red-400")} />
            {socketConnected ? "Live" : "Reconnecting…"}
          </span>

          {/* Online avatars */}
          <div className="hidden md:flex items-center -space-x-1.5">
            {members.filter((m) => m.online).slice(0, 4).map((m) => (
              <div key={m.userId} title={m.name}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: m.avatarColor || "#7C3AED", borderColor: isDark ? "#09090b" : "#fff" }}>
                {getInitials(m.name)}
              </div>
            ))}
            {onlineCount > 4 && (
              <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold",
                isDark ? "bg-zinc-700 border-zinc-950 text-zinc-300" : "bg-zinc-200 border-white text-zinc-600")}>
                +{onlineCount - 4}
              </div>
            )}
          </div>

          {document && <div className="hidden lg:block"><RoleBadge role={document.userRole} isDark={isDark} /></div>}

          {canEdit && (
            <button onClick={handleManualSave}
              className={cn("hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200", ghostBtn)}
              title="Save version (Ctrl+S)">
              <Save className="w-3.5 h-3.5" />Save
            </button>
          )}

          <button
            onClick={() => setShowHistory((v) => !v)}
            className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              showHistory ? "text-violet-500 bg-violet-500/10" : ghostBtn)}
            title="Version History">
            <History className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">History</span>
          </button>

          {isOwner && (
            <button onClick={() => setShowInvite(true)}
              className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:border-zinc-600" : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200")}>
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          )}

          {/* Right sidebar toggle */}
          <button
            onClick={() => setRightOpen((v) => !v)}
            className={cn("hidden xl:inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 focus:outline-none", ghostBtn)}
            title={rightOpen ? "Hide chat & comments" : "Show chat & comments"}
          >
            {rightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setExportOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg transition-colors duration-200",
                ghostBtn,
                "border-[var(--border)] hover:bg-[var(--bg-hover)]"
              )}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={async () => {
                    setExportOpen(false);
                    setExporting("pdf");
                    try {
                      await exportAsPDF(
                        pendingContentRef.current ?? document?.content ?? "",
                        titleValue || "document"
                      );
                    } finally {
                      setExporting(null);
                    }
                  }}
                  disabled={exporting === "pdf"}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors duration-200 text-left disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4 text-[var(--accent)]" />
                  {exporting === "pdf" ? "Exporting..." : "Export as PDF"}
                </button>
                <div className="border-t border-[var(--border)]" />
                <button
                  onClick={async () => {
                    setExportOpen(false);
                    setExporting("docx");
                    try {
                      await exportAsDOCX(
                        pendingContentRef.current ?? document?.content ?? "",
                        titleValue || "document"
                      );
                    } finally {
                      setExporting(null);
                    }
                  }}
                  disabled={exporting === "docx"}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors duration-200 text-left disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                  {exporting === "docx" ? "Exporting..." : "Export as DOCX"}
                </button>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <ThemeToggle isDark={isDark} onToggle={() => setTheme((v) => v === "dark" ? "light" : "dark")} />
        </div>
      </header>

      {/* ══ 3-COLUMN BODY ════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL: Collaborators ─────────────────────────────────────── */}
        <aside className={cn(
          "shrink-0 flex-col border-r transition-all duration-300 hidden lg:flex overflow-hidden",
          leftPanelBg,
          leftOpen ? "w-64" : "w-0 border-r-0"
        )}>
          {/* Header */}
          <div className={cn("p-4 border-b shrink-0", isDark ? "border-zinc-800/70" : "border-zinc-200")}>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-xs font-semibold uppercase tracking-widest", sectionHead)}>People</h3>
              <span className={cn("flex items-center gap-1.5 text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                {onlineCount} online
              </span>
            </div>
          </div>

          {/* Members list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {members.length === 0 ? (
              <div className="text-center py-10">
                <Users className={cn("w-8 h-8 mx-auto mb-2", isDark ? "text-zinc-700" : "text-zinc-300")} />
                <p className={cn("text-xs", isDark ? "text-zinc-600" : "text-zinc-400")}>No people yet</p>
              </div>
            ) : (
              members.map((m) => {
                const isMe        = m.userId === currentUser?.id;
                const isTypingNow = typingUsers.includes(m.name);
                const color       = m.avatarColor || "#7C3AED";
                return (
                  <div key={m.userId}
                    className={cn("flex items-center gap-3 p-2.5 rounded-xl transition-colors", hoverRow)}>
                    {/* Avatar with glowing ring */}
                    <div className="relative shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all"
                        style={{
                          backgroundColor: color,
                          boxShadow: m.online
                            ? `0 0 0 2px ${isDark ? "rgba(9,9,11,1)" : "#fff"}, 0 0 0 4px ${color}, 0 0 12px ${color}80`
                            : `0 0 0 2px ${isDark ? "rgba(9,9,11,1)" : "#fff"}, 0 0 0 3px ${color}40`,
                          opacity: m.online ? 1 : 0.6,
                        }}
                      >
                        {getInitials(m.name)}
                      </div>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2",
                          isDark ? "border-zinc-950" : "border-white",
                          m.online ? "bg-violet-400" : "bg-zinc-500"
                        )}
                        title={m.online ? "Online" : "Offline"}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium truncate", isDark ? "text-zinc-200" : "text-zinc-800")}>
                        {m.name}
                        {isMe && (
                          <span className={cn("font-normal", isDark ? "text-zinc-500" : "text-zinc-400")}> (you)</span>
                        )}
                      </p>
                      {isTypingNow ? (
                        <span className="flex items-center gap-1 mt-0.5">
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="typing-dot w-1 h-1 rounded-full bg-violet-400"
                              style={{ animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </span>
                      ) : (
                        <p className={cn("text-xs truncate", isDark ? "text-zinc-600" : "text-zinc-400")}>
                          {m.online ? "Active now" : "Offline"}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0">
                      <RoleBadge role={m.role} isDark={isDark} />
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className={cn("p-4 border-t shrink-0", isDark ? "border-zinc-800/70" : "border-zinc-200")}>
            <p className={cn("text-xs", isDark ? "text-zinc-600" : "text-zinc-400")}>
              {members.length} {members.length === 1 ? "person" : "people"} with access
            </p>
          </div>
        </aside>

        {/* ── CENTER CANVAS ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-violet-400"
                      style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>
                  {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
                </span>
              </div>
            )}

            {/* Editor card */}
            <div className={cn("rounded-2xl border transition-all duration-300 overflow-hidden", editorCardCls)}>
              {document && currentUser && (
                <Editor
                  key={documentId}
                  documentId={documentId}
                  initialContent={document.content}
                  currentUser={currentUser}
                  userRole={document.userRole}
                  theme={theme}
                  onContentChange={handleContentChange}
                />
              )}
            </div>

            {/* Save status footer */}
            <div className={cn("flex items-center justify-between gap-4 mt-3 px-1 text-xs",
              isDark ? "text-zinc-600" : "text-zinc-400")}>
              <span>
                {saveStatus === "saving" && "Saving…"}
                {saveStatus === "saved" && "All changes saved"}
                {saveStatus === "error" && <span className="text-red-400">Save failed — retrying on next edit</span>}
              </span>
              {document && <span>Updated {formatDate(document.updatedAt)}</span>}
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL: Chat + Comments (tabbed, collapsible) ────────────── */}
        <aside className={cn(
          "shrink-0 flex-col border-l transition-all duration-300 hidden xl:flex overflow-hidden",
          rightPanelBg,
          rightOpen ? "w-80" : "w-0 border-l-0"
        )}>
          {/* Tab bar */}
          <div className={cn("shrink-0 border-b", isDark ? "border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm" : "border-zinc-200 bg-zinc-50/80")}>
            <div className="flex items-center px-3 pt-3 gap-1">
              <button
                onClick={() => setRightTab("chat")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition-all duration-150",
                  rightTab === "chat"
                    ? isDark ? "border-violet-400 text-violet-400 bg-violet-500/5" : "border-violet-500 text-violet-600 bg-violet-50"
                    : isDark ? "border-transparent text-zinc-500 hover:text-zinc-300" : "border-transparent text-zinc-400 hover:text-zinc-600"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Room Chat
                {chatMessages.length > 0 && (
                  <span className={cn("ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600")}>
                    {chatMessages.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRightTab("comments")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition-all duration-150",
                  rightTab === "comments"
                    ? isDark ? "border-violet-400 text-violet-400 bg-violet-500/5" : "border-violet-500 text-violet-600 bg-violet-50"
                    : isDark ? "border-transparent text-zinc-500 hover:text-zinc-300" : "border-transparent text-zinc-400 hover:text-zinc-600"
                )}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Comments
                {comments.length > 0 && (
                  <span className={cn("ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600")}>
                    {comments.length}
                  </span>
                )}
              </button>
              <div className="ml-auto flex items-center gap-1 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_6px_rgba(167,139,250,0.8)]" />
                <span className="text-[10px] text-violet-500 font-medium">Live</span>
              </div>
            </div>
          </div>

          {/* ── CHAT TAB ─────────────────────────────────────────────────── */}
          {rightTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scroll-smooth">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border",
                      isDark ? "bg-zinc-800/60 border-zinc-700/50" : "bg-zinc-100 border-zinc-200")}>
                      <MessageSquare className={cn("w-5 h-5", isDark ? "text-zinc-600" : "text-zinc-400")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", isDark ? "text-zinc-500" : "text-zinc-400")}>No messages yet</p>
                      <p className={cn("text-xs mt-1", isDark ? "text-zinc-600" : "text-zinc-400")}>Start the conversation.</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={msg.isOwn || msg.senderName === currentUser?.name}
                      isDark={isDark}
                    />
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div className={cn("shrink-0 p-3 border-t", isDark ? "border-zinc-800/80 bg-zinc-950/30" : "border-zinc-200 bg-zinc-50/80")}>
                <div className="flex items-end gap-2">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Message the room…"
                    rows={1}
                    maxLength={500}
                    className={cn("flex-1 resize-none rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-1 transition-all duration-200 leading-relaxed max-h-28 overflow-y-auto", inputCls)}
                    style={{ scrollbarWidth: "none" }}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim()}
                    title="Send (Enter)"
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(124,58,237,0.3)]"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className={cn("text-[10px] mt-1.5 text-right", isDark ? "text-zinc-700" : "text-zinc-400")}>
                  Enter to send · Shift+Enter for newline
                </p>
              </div>
            </>
          )}

          {/* ── COMMENTS TAB — open to ALL roles ─────────────────────────── */}
          {rightTab === "comments" && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border",
                      isDark ? "bg-zinc-800/60 border-zinc-700/50" : "bg-zinc-100 border-zinc-200")}>
                      <MessageCircle className={cn("w-5 h-5", isDark ? "text-zinc-600" : "text-zinc-400")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", isDark ? "text-zinc-500" : "text-zinc-400")}>No comments yet</p>
                      <p className={cn("text-xs mt-1", isDark ? "text-zinc-600" : "text-zinc-400")}>
                        Anyone in the room can add a comment.
                      </p>
                    </div>
                  </div>
                ) : (
                  comments.map((c) => (
                    <CommentCard key={c.id} comment={c} isDark={isDark} />
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment input — enabled for ALL roles including viewers */}
              <div className={cn("shrink-0 p-3 border-t", isDark ? "border-zinc-800/80 bg-zinc-950/30" : "border-zinc-200 bg-zinc-50/80")}>
                <div className="flex items-end gap-2">
                  <textarea
                    ref={commentInputRef}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    placeholder="Add a comment… (all roles can comment)"
                    rows={2}
                    maxLength={600}
                    className={cn("flex-1 resize-none rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-1 transition-all duration-200 leading-relaxed max-h-28 overflow-y-auto", inputCls)}
                    style={{ scrollbarWidth: "none" }}
                  />
                  <button
                    onClick={postComment}
                    disabled={!commentInput.trim()}
                    title="Post comment (Enter)"
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className={cn("text-[10px] mt-1.5 text-right", isDark ? "text-zinc-700" : "text-zinc-400")}>
                  Enter to post · Shift+Enter for newline
                </p>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ── Version History overlay ───────────────────────────────────────── */}
      {showHistory && (
        <div className={cn(
          "fixed inset-y-0 right-0 z-40 w-72 border-l flex flex-col overflow-hidden animate-slide-in-right shadow-2xl",
          isDark ? "bg-zinc-950/95 border-zinc-800/70 backdrop-blur-xl" : "bg-white border-zinc-200"
        )}>
          <div className={cn("p-4 border-b flex items-center justify-between shrink-0",
            isDark ? "border-zinc-800/70" : "border-zinc-200")}>
            <h3 className={cn("text-xs font-semibold uppercase tracking-widest", sectionHead)}>
              Version History
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className={cn("p-1 rounded-lg transition-colors",
                isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100")}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!document?.versionHistory?.length ? (
              <div className="text-center py-8">
                <History className={cn("w-8 h-8 mx-auto mb-2", isDark ? "text-zinc-700" : "text-zinc-300")} />
                <p className={cn("text-xs", isDark ? "text-zinc-600" : "text-zinc-400")}>No saved versions yet</p>
                <p className={cn("text-xs mt-1", isDark ? "text-zinc-700" : "text-zinc-400")}>Press Save to create one</p>
              </div>
            ) : (
              [...document.versionHistory].reverse().map((version, idx) => (
                <div key={version._id}
                  className={cn("p-3 rounded-xl border space-y-2 transition-colors",
                    isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-zinc-700")}>
                        {idx === 0 ? "Latest version" : `Version ${document.versionHistory.length - idx}`}
                      </p>
                      <p className={cn("text-[11px] mt-0.5", isDark ? "text-zinc-600" : "text-zinc-400")}>
                        {formatDate(version.savedAt)}
                      </p>
                      {version.savedBy && (
                        <p className={cn("text-[11px]", isDark ? "text-zinc-600" : "text-zinc-400")}>
                          by {typeof version.savedBy === "object" ? version.savedBy.name : version.savedBy}
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRestoreVersion(version._id)}
                        disabled={restoringVersion === version._id}
                        className={cn(
                          "shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-all duration-150 disabled:opacity-50",
                          isDark
                            ? "text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 border-zinc-700 hover:border-violet-500/30"
                            : "text-zinc-500 hover:text-violet-600 hover:bg-violet-50 border-zinc-200 hover:border-violet-300"
                        )}
                      >
                        {restoringVersion === version._id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <RotateCcw className="w-3 h-3" />}
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Invite Modal ──────────────────────────────────────────────────── */}
      {showInvite && document && (
        <InviteModal
          doc={document}
          isDark={isDark}
          onClose={() => setShowInvite(false)}
          onShared={() => {
            loadDocument();
            showToast("Collaborator added successfully.", "success");
          }}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium toast-enter",
          toast.type === "success" && (isDark ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "bg-violet-50 border-violet-200 text-violet-700"),
          toast.type === "error"   && (isDark ? "bg-red-500/15 border-red-500/30 text-red-300" : "bg-red-50 border-red-200 text-red-600"),
          toast.type === "info"    && (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700 shadow-lg")
        )}>
          {toast.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toast.type === "error"   && <AlertCircle  className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
