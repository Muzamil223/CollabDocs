"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Eraser, Upload, Loader2, Eye,
} from "lucide-react";
import { connectSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

/**
 * Editor — WYSIWYG rich-text writing surface with real-time collaboration.
 *
 * Props:
 *   documentId      — MongoDB document _id
 *   initialContent  — HTML string loaded from the DB
 *   currentUser     — { id, name, avatarColor, … }
 *   userRole        — "owner" | "edit" | "view"
 *   theme           — "dark" | "light"
 *   onContentChange — called with latest HTML on every edit (debounced by parent)
 *   onChatMessage   — called with { senderName, messageText, timestamp } on remote chat
 *   onComment       — called with { authorName, text, timestamp, avatarColor } on remote comment
 *
 * PERMISSION MODEL:
 *   - "owner" / "edit"  → full WYSIWYG editing, toolbar visible
 *   - "view"            → document body is read-only (contentEditable=false),
 *                         amber view-only banner shown, toolbar hidden
 *
 * COMMENT PARTICIPATION:
 *   ALL roles (including "view") can post and receive comments. The comment
 *   input lives in the parent page, not here. This component only manages the
 *   socket listeners for receive-chat-message and receive-comment so that
 *   EVERY connected socket — regardless of role — gets live updates.
 */
export default function Editor({
  documentId,
  initialContent,
  currentUser,
  userRole,
  theme = "dark",
  onContentChange,
}) {
  const editorRef      = useRef(null);
  const socketRef      = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef   = useRef(null);
  const isRemoteRef    = useRef(false);
  const isTypingRef    = useRef(false);

  const [importing, setImporting]         = useState(false);
  const [importError, setImportError]     = useState("");
  const [activeFormats, setActiveFormats] = useState({});

  const isDark  = theme === "dark";
  const canEdit = userRole === "owner" || userRole === "edit";
  const isView  = !canEdit;

  // ── Caret preservation across innerHTML replacement ───────────────────────
  const getCaretOffset = useCallback((root) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.startContainer)) return null;
    const pre = range.cloneRange();
    pre.selectNodeContents(root);
    pre.setEnd(range.startContainer, range.startOffset);
    return pre.toString().length;
  }, []);

  const restoreCaret = useCallback((root, offset) => {
    if (offset == null) return;
    const walker = window.document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let remaining = offset;
    let node = walker.nextNode();
    let target = null;
    let targetOffset = 0;
    while (node) {
      const len = node.textContent.length;
      if (remaining <= len) { target = node; targetOffset = remaining; break; }
      remaining -= len;
      node = walker.nextNode();
    }
    const sel = window.getSelection();
    if (!sel) return;
    try {
      const range = window.document.createRange();
      if (target) range.setStart(target, targetOffset);
      else { range.selectNodeContents(root); range.collapse(false); }
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch { /* best-effort */ }
  }, []);

  // ── Seed initial content ──────────────────────────────────────────────────
  useEffect(() => {
    if (!editorRef.current) return;
    const incoming = initialContent || "";
    if (editorRef.current.innerHTML !== incoming) {
      editorRef.current.innerHTML = incoming;
    }
  }, [initialContent]);

  // ── Socket: join room + receive document changes ──────────────────────────
  // Only document content sync lives here. Chat and comment listeners are
  // registered directly in the page's socket useEffect so they work for ALL
  // roles (including viewers who may not have the Editor mounted yet) and
  // avoid stale-closure / duplicate-listener issues from prop callbacks.
  useEffect(() => {
    if (!documentId || !currentUser) return;

    const socket = connectSocket();
    socketRef.current = socket;

    const joinRoom = () => socket.emit("join-document", { documentId });
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    const handleReceiveChanges = (delta) => {
      const root = editorRef.current;
      if (!root || typeof delta !== "string" || delta === root.innerHTML) return;
      isRemoteRef.current = true;
      const caret = getCaretOffset(root);
      root.innerHTML = delta;
      if (caret != null) restoreCaret(root, caret);
      isRemoteRef.current = false;
    };
    socket.on("receive-changes", handleReceiveChanges);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("receive-changes", handleReceiveChanges);
    };
  }, [documentId, currentUser, getCaretOffset, restoreCaret]);

  // ── Broadcast document content changes ───────────────────────────────────
  const broadcast = useCallback((html) => {
    socketRef.current?.emit("send-changes", { documentId, delta: html });
    onContentChange?.(html);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current?.emit("typing-start", { documentId });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketRef.current?.emit("typing-stop", { documentId });
    }, 1500);
  }, [documentId, onContentChange]);

  // ── Active format tracking for toolbar highlight ──────────────────────────
  const refreshFormats = useCallback(() => {
    if (isView) return;
    try {
      setActiveFormats({
        bold:                window.document.queryCommandState("bold"),
        italic:              window.document.queryCommandState("italic"),
        underline:           window.document.queryCommandState("underline"),
        insertUnorderedList: window.document.queryCommandState("insertUnorderedList"),
        insertOrderedList:   window.document.queryCommandState("insertOrderedList"),
      });
    } catch { /* queryCommandState can throw if focus is elsewhere */ }
  }, [isView]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isRemoteRef.current) return;
    broadcast(editorRef.current.innerHTML);
    refreshFormats();
  }, [broadcast, refreshFormats]);

  // ── execCommand helpers ───────────────────────────────────────────────────
  const exec = useCallback((cmd, val = null) => {
    if (!canEdit) return;
    editorRef.current?.focus();
    window.document.execCommand(cmd, false, val);
    handleInput();
    refreshFormats();
  }, [canEdit, handleInput, refreshFormats]);

  const formatBlock = useCallback((tag) => {
    if (!canEdit) return;
    editorRef.current?.focus();
    window.document.execCommand("formatBlock", false, `<${tag}>`);
    handleInput();
  }, [canEdit, handleInput]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (!canEdit) return;
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const k = e.key.toLowerCase();
    if (k === "b") { e.preventDefault(); exec("bold"); }
    else if (k === "i") { e.preventDefault(); exec("italic"); }
    else if (k === "u") { e.preventDefault(); exec("underline"); }
  }, [canEdit, exec]);

  // ── Paste as plain text ───────────────────────────────────────────────────
  const handlePaste = useCallback((e) => {
    if (!canEdit) return;
    e.preventDefault();
    window.document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    handleInput();
  }, [canEdit, handleInput]);

  // ── File import ───────────────────────────────────────────────────────────
  const MAX_BYTES = 5 * 1024 * 1024;

  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const textToHtml = (raw) =>
    raw.split(/\r?\n/)
      .map((l) => l.trim() ? `<p>${escapeHtml(l)}</p>` : "<p><br></p>")
      .join("") || "<p><br></p>";

  const applyHtml = useCallback((html) => {
    const safe = html?.trim() ? html : "<p><br></p>";
    if (editorRef.current) {
      editorRef.current.innerHTML = safe;
      broadcast(safe);
    }
  }, [broadcast]);

  const handleImportClick = useCallback(() => {
    if (!canEdit) return;
    setImportError("");
    fileInputRef.current?.click();
  }, [canEdit]);

  const handleFileSelected = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canEdit) return;
    if (file.size > MAX_BYTES) { setImportError("File too large (max 5 MB)."); return; }
    const name = file.name.toLowerCase();
    const ext = name.split(".").pop();
    const supported = ["docx", "odt", "txt", "md", "markdown"];
    if (!supported.includes(ext) && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setImportError(`Unsupported format (.${ext}). Supported: .docx, .txt, .md, .odt`);
      return;
    }
    setImporting(true);
    setImportError("");
    try {
      if (ext === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const mammoth = await import("mammoth/mammoth.browser");
        const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        applyHtml(result.value);
      } else if (ext === "odt") {
        const mammoth = await import("mammoth/mammoth.browser");
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
          applyHtml(result.value);
        } catch {
          applyHtml(textToHtml(await file.text()));
        }
      } else {
        applyHtml(textToHtml(await file.text()));
      }
    } catch {
      setImportError("Could not read that file. Please try another.");
    } finally {
      setImporting(false);
    }
  }, [canEdit, applyHtml]);

  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

  // ── Toolbar definition ────────────────────────────────────────────────────
  const tools = [
    { id: "bold",                icon: Bold,         label: "Bold (Ctrl+B)",      action: () => exec("bold") },
    { id: "italic",              icon: Italic,        label: "Italic (Ctrl+I)",    action: () => exec("italic") },
    { id: "underline",           icon: Underline,     label: "Underline (Ctrl+U)", action: () => exec("underline") },
    { divider: true },
    { id: "h1",                  icon: Heading1,      label: "Heading 1",          action: () => formatBlock("h1") },
    { id: "h2",                  icon: Heading2,      label: "Heading 2",          action: () => formatBlock("h2") },
    { id: "h3",                  icon: Heading3,      label: "Heading 3",          action: () => formatBlock("h3") },
    { divider: true },
    { id: "insertUnorderedList", icon: List,          label: "Bullet list",        action: () => exec("insertUnorderedList") },
    { id: "insertOrderedList",   icon: ListOrdered,   label: "Numbered list",      action: () => exec("insertOrderedList") },
    { id: "blockquote",          icon: Quote,         label: "Quote",              action: () => formatBlock("blockquote") },
    { id: "pre",                 icon: Code,          label: "Code block",         action: () => formatBlock("pre") },
    { divider: true },
    { id: "removeFormat",        icon: Eraser,        label: "Clear formatting",   action: () => exec("removeFormat") },
  ];

  // ── Theme-aware class tokens ──────────────────────────────────────────────
  const toolbarBg     = isDark ? "bg-zinc-950/60 border-zinc-800/70" : "bg-white/90 border-zinc-200";
  const toolbarBtn    = isDark
    ? "text-zinc-400 hover:text-violet-400 hover:bg-zinc-800"
    : "text-zinc-500 hover:text-violet-600 hover:bg-zinc-100";
  const toolbarActive = isDark ? "bg-violet-500/15 text-violet-400" : "bg-violet-100 text-violet-600";
  const dividerColor  = isDark ? "bg-zinc-800" : "bg-zinc-200";
  const importBtnCls  = isDark
    ? "text-zinc-200 border-zinc-700/80 bg-zinc-800/60 hover:border-violet-500/50 hover:text-violet-300 hover:bg-violet-500/10"
    : "text-zinc-700 border-zinc-300 bg-zinc-50 hover:border-violet-500/60 hover:text-violet-600 hover:bg-violet-50";
  const surfaceCls    = isDark
    ? "rte-content-dark min-h-[55vh] px-8 sm:px-12 py-8 focus:outline-none"
    : "rte-content-light min-h-[55vh] px-8 sm:px-12 py-8 focus:outline-none";

  return (
    <div className="flex flex-col h-full">

      {/* ── View-only banner ─────────────────────────────────────────────── */}
      {isView && (
        <div className={cn(
          "flex items-center gap-3 px-5 py-3 border-b",
          isDark
            ? "border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent"
            : "border-amber-400/30 bg-gradient-to-r from-amber-50 to-transparent"
        )}>
          <Eye className={cn("w-4 h-4 shrink-0", isDark ? "text-amber-400" : "text-amber-500")} />
          <p className={cn("text-sm", isDark ? "text-amber-300/90" : "text-amber-700")}>
            <span className="font-semibold">View-only.</span>{" "}
            You can read this document but editing is disabled for your role.
            You can still post comments and chat with the room.
          </p>
        </div>
      )}

      {/* ── Toolbar (editors/owners only) ────────────────────────────────── */}
      {!isView && (
        <div className={cn(
          "flex items-center gap-0.5 px-3 py-2 border-b backdrop-blur-md flex-wrap sticky top-0 z-10",
          toolbarBg
        )}>
          {tools.map((tool, i) =>
            tool.divider ? (
              <div key={`div-${i}`} className={cn("w-px h-5 mx-1.5", dividerColor)} />
            ) : (
              <button
                key={tool.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); tool.action(); }}
                title={tool.label}
                aria-pressed={!!activeFormats[tool.id]}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 active:scale-95",
                  activeFormats[tool.id] ? toolbarActive : toolbarBtn
                )}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            )
          )}

          {/* Import Local File */}
          <div className="ml-auto flex items-center gap-2.5">
            {importError && <span className="text-xs text-red-400">{importError}</span>}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,.docx,.odt,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text"
              onChange={handleFileSelected}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleImportClick(); }}
              disabled={importing}
              title="Import a local .txt, .md, or .docx file"
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
                importBtnCls
              )}
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Import File
            </button>
          </div>
        </div>
      )}

      {/* ── Writing surface ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div
          ref={editorRef}
          contentEditable={canEdit}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onKeyUp={refreshFormats}
          onMouseUp={refreshFormats}
          role="textbox"
          aria-multiline="true"
          aria-label="Document body"
          aria-readonly={isView}
          spellCheck={!isView}
          data-placeholder={
            isView
              ? "This document is in view-only mode. Use the Comments panel to participate in the discussion."
              : "Start writing here… Select text and use the toolbar or Ctrl+B / Ctrl+I / Ctrl+U to format."
          }
          className={surfaceCls}
          style={{
            caretColor: isDark ? "#a78bfa" : "#6d28d9",
            cursor: canEdit ? "text" : "default",
          }}
        />
      </div>
    </div>
  );
}
