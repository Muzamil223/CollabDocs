"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Loader2, AlertCircle, Clock, Users, Crown,
  Pencil, Eye, Download, ChevronDown, Share2, MessageSquare, History,
  ExternalLink, Send,
} from "lucide-react";
import { fetchDocument, addComment } from "@/lib/api";
import { getStoredUser, getStoredToken } from "@/lib/auth";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { exportAsPDF, exportAsDOCX } from "@/lib/exportDocument";

function RoleBadge({ role }) {
  if (role === "owner") return <span className="badge-owner"><Crown className="w-3 h-3" /> Owner</span>;
  if (role === "edit") return <span className="badge-editor"><Pencil className="w-3 h-3" /> Editor</span>;
  return <span className="badge-viewer"><Eye className="w-3 h-3" /> Viewer</span>;
}

export default function DocumentViewPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id;

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    const user = getStoredUser();
    const token = getStoredToken();
    if (!user || !token) { router.replace("/login"); return; }
    loadDocument();
  }, [documentId, router]);

  const loadDocument = async () => {
    try {
      setLoading(true); setError("");
      const res = await fetchDocument(documentId);
      setDoc(res.data.document);
    } catch (err) {
      if (err.response?.status === 403) setError("You don't have permission to view this document.");
      else if (err.response?.status === 404) setError("Document not found.");
      else setError("Failed to load document.");
    } finally { setLoading(false); }
  };

  const handleExport = useCallback(async (type) => {
    if (!doc) return;
    setExporting(type); setExportOpen(false);
    try {
      if (type === "pdf") await exportAsPDF(doc.content || "", doc.title);
      else await exportAsDOCX(doc.content || "", doc.title);
    } finally { setExporting(null); }
  }, [doc]);

  const handlePostComment = async () => {
    const text = commentInput.trim();
    if (!text) return;
    setPostingComment(true);
    try {
      await addComment(documentId, { text });
      const user = getStoredUser();
      // Optimistically append the comment
      setDoc((prev) => prev ? {
        ...prev,
        comments: [...(prev.comments || []), {
          _id: Date.now().toString(),
          authorName: user?.name || "You",
          avatarColor: user?.avatarColor || "#7C3AED",
          text,
          createdAt: new Date().toISOString(),
        }],
      } : prev);
      setCommentInput("");
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      // silently fail — comment will appear on next load
    } finally { setPostingComment(false); }
  };

  const canEdit = doc?.userRole === "owner" || doc?.userRole === "edit";
  const isPdf = doc?.content?.startsWith("<!--PDF_DOCUMENT-->");
  const wordCount = (!isPdf && doc?.content) ? doc.content.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length : 0;
  const members = [];
  if (doc) {
    const seen = new Set();
    if (doc.owner?._id) {
      members.push({ ...doc.owner, role: "owner" });
      seen.add(doc.owner._id.toString());
    }
    (doc.permittedCollaborators || []).forEach((c) => {
      const id = c.userId?._id?.toString();
      if (id && !seen.has(id)) {
        seen.add(id);
        members.push({ ...c.userId, role: c.role });
      }
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Loading document…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center animate-slide-up">
          <AlertCircle className="w-10 h-10 text-[var(--destructive)] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Error</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">{error}</p>
          <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-x-0 border-t-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/dashboard")} className="btn-ghost p-2 shrink-0" aria-label="Back">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">{doc?.title}</h1>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                <Clock className="w-3 h-3" /> Last edited {formatDate(doc?.updatedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Export dropdown — not needed for PDFs (they're already viewable/downloadable) */}
            {!isPdf && (
              <div className="relative">
                <button onClick={() => setExportOpen((v) => !v)}
                  className="btn-secondary text-sm" disabled={!!exporting}>
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export <ChevronDown className="w-3 h-3" />
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl z-50 py-1 animate-slide-up">
                      <button onClick={() => handleExport("pdf")}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
                        <FileText className="w-4 h-4 text-red-500" /> Export as PDF
                      </button>
                      <button onClick={() => handleExport("docx")}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
                        <FileText className="w-4 h-4 text-blue-500" /> Export as DOCX
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* Open in Editor — only for owners/editors, not for PDFs */}
            {canEdit && !isPdf && (
              <Link href={`/documents/${documentId}`}
                className="btn-primary text-sm">
                <Pencil className="w-4 h-4" /> Open in Editor
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Document content preview */}
        <div className="card overflow-hidden">
          {doc?.content?.startsWith("<!--PDF_DOCUMENT-->") ? (
            /* PDF document — render native viewer */
            <iframe
              src={doc.content.replace("<!--PDF_DOCUMENT-->", "")}
              className="w-full min-h-[80vh] rounded-xl"
              title={doc.title}
              style={{ border: "none" }}
            />
          ) : (
            <div className="p-8 lg:p-10">
              <div className="prose prose-zinc dark:prose-invert max-w-none rte-content-dark"
                dangerouslySetInnerHTML={{ __html: doc?.content || "<p class='text-[var(--text-muted)]'>This document is empty.</p>" }} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Info card */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Document Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Your role</span>
                <RoleBadge role={doc?.userRole} />
              </div>
              {isPdf && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Format</span>
                  <span className="text-[var(--text-primary)] font-medium text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">PDF</span>
                </div>
              )}
              {!isPdf && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Words</span>
                  <span className="text-[var(--text-primary)] font-medium">{wordCount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Created</span>
                <span className="text-[var(--text-primary)] font-medium">{formatDate(doc?.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Versions</span>
                <span className="text-[var(--text-primary)] font-medium">{doc?.versionHistory?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Collaborators card */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent)]" /> Collaborators ({members.length})
            </h3>
            <div className="space-y-2.5">
              {members.map((m) => (
                <div key={m._id} className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: m.avatarColor || "#7C3AED" }}>
                    {getInitials(m.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{m.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{m.email}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] capitalize shrink-0">{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comments — visible to all roles, everyone can post */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--accent)]" /> Comments ({doc?.comments?.length || 0})
            </h3>
            {doc?.comments?.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {doc.comments.map((c) => (
                  <div key={c._id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ backgroundColor: c.avatarColor || "#7C3AED" }}>
                        {getInitials(c.authorName)}
                      </span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{c.authorName}</span>
                      <span className="text-[var(--text-muted)] text-xs ml-auto">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{c.text}</p>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No comments yet. Be the first to leave one!</p>
            )}

            {/* Comment input — all roles can post */}
            <div className="flex items-end gap-2 pt-2 border-t border-[var(--border)]">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                placeholder="Add a comment…"
                rows={2}
                maxLength={600}
                className="input-field flex-1 resize-none text-sm py-2.5 min-h-[44px] max-h-28"
                disabled={postingComment}
              />
              <button
                onClick={handlePostComment}
                disabled={!commentInput.trim() || postingComment}
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center btn-primary p-0 disabled:opacity-40"
                title="Post comment"
              >
                {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
