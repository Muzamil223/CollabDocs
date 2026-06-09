"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, FileText, Search, Trash2, Edit3, Clock, Users, ChevronRight,
  Loader2, AlertCircle, X, Check, MoreVertical, Crown, Eye, Pencil,
  Share2, Mail, ShieldCheck, UserPlus, Upload, FileStack, Share, Activity,
} from "lucide-react";
import {
  fetchDocuments, createDocument, deleteDocument, updateDocument, shareDocument,
} from "@/lib/api";
import { getStoredUser, getStoredToken } from "@/lib/auth";
import { cn, formatDate, truncate } from "@/lib/utils";

/* ── Role badge ───────────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  if (role === "owner") return <span className="badge-owner"><Crown className="w-3 h-3" /> Owner</span>;
  if (role === "edit") return <span className="badge-editor"><Pencil className="w-3 h-3" /> Editor</span>;
  return <span className="badge-viewer"><Eye className="w-3 h-3" /> Viewer</span>;
}

function RoleOption({ active, onClick, icon, title, desc }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all duration-200",
        active ? "border-[var(--accent)] bg-[var(--accent-subtle)] ring-2 ring-[var(--ring)]" : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]")}>
      <span className={cn("flex items-center gap-1.5 text-sm font-medium", active ? "text-[var(--accent)]" : "text-[var(--text-primary)]")}>
        {icon}{title}
      </span>
      <span className="text-xs text-[var(--text-muted)]">{desc}</span>
    </button>
  );
}

/* ── Share modal ──────────────────────────────────────────────────────────── */
function ShareModal({ doc, onClose, onShared }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("view");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) return setError("Please enter a valid email address.");
    setSubmitting(true);
    try {
      const res = await shareDocument(doc._id, { email: trimmed, role });
      setSuccess(res.data?.message || "Collaborator added.");
      setEmail("");
      onShared?.(res.data?.collaborator);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to share document.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card w-full max-w-md p-6 shadow-2xl animate-slide-up">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
              <Share2 className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">Share Document</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-[260px]">{doc.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Invite by email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              <input ref={inputRef} type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="teammate@example.com" className="input-field pl-10" disabled={submitting} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Permission level</label>
            <div className="grid grid-cols-2 gap-2.5">
              <RoleOption active={role === "view"} onClick={() => setRole("view")} icon={<Eye className="w-4 h-4" />} title="Viewer" desc="Can read only" />
              <RoleOption active={role === "edit"} onClick={() => setRole("edit")} icon={<Pencil className="w-4 h-4" />} title="Editor" desc="Can edit content" />
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" /><p className="text-error text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" /><p className="text-success text-sm">{success}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Done</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sharing…</> : <><UserPlus className="w-4 h-4" /> Add Person</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: tone.bg, color: tone.fg }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-[var(--text-primary)] leading-none">{value}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

/* ── Document card ────────────────────────────────────────────────────────── */
function DocumentCard({
  doc, isMenuOpen, isRenaming, renameValue, isDeleting, isRemoving,
  onOpen, onToggleMenu, onStartRename, onRenameChange, onRenameSubmit,
  onCancelRename, onStartShare, onAskDelete, onCancelDelete, onConfirmDelete,
}) {
  const isOwner = doc.userRole === "owner";
  const canEdit = isOwner || doc.userRole === "edit";

  return (
    <div className={cn("card-hover group relative flex flex-col p-5 gap-3",
      isRemoving ? "opacity-0 scale-95 transition-all duration-300" : "animate-fade-in",
      isDeleting && "border-red-500/40")}
      onClick={() => { if (!isRenaming && !isDeleting && !isMenuOpen) onOpen(doc); }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/15 to-pink-500/15 flex items-center justify-center shrink-0 border border-[var(--border)]">
            <FileText className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <input autoFocus value={renameValue} onChange={(e) => onRenameChange(e.target.value)}
                onBlur={() => onRenameSubmit(doc._id)}
                onKeyDown={(e) => { if (e.key === "Enter") onRenameSubmit(doc._id); if (e.key === "Escape") onCancelRename(); }}
                onClick={(e) => e.stopPropagation()} className="input-field py-1 text-sm font-medium" maxLength={200} />
            ) : (
              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{doc.title}</h3>
            )}
          </div>
        </div>

        {canEdit && !isDeleting && (
          <div className="relative shrink-0">
            <button type="button"
              className={cn("btn-ghost p-1.5 transition-opacity", isMenuOpen ? "opacity-100 bg-[var(--bg-hover)]" : "opacity-0 group-hover:opacity-100")}
              onClick={(e) => { e.stopPropagation(); onToggleMenu(doc._id); }} aria-label="Document actions" aria-expanded={isMenuOpen}>
              <MoreVertical className="w-4 h-4" />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onToggleMenu(null); }} />
                <div className="absolute right-0 top-9 z-50 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl animate-slide-up py-1.5 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  {isOwner && (
                    <button type="button" className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] transition-colors"
                      onClick={() => onStartShare(doc)}>
                      <Share2 className="w-3.5 h-3.5" /> Share Permissions
                    </button>
                  )}
                  <button type="button" className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                    onClick={() => onStartRename(doc)}>
                    <Edit3 className="w-3.5 h-3.5" /> Rename
                  </button>
                  {isOwner && (
                    <>
                      <div className="my-1 h-px bg-[var(--border)]" />
                      <button type="button" className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-error hover:bg-red-500/10 transition-colors"
                        onClick={() => onAskDelete(doc._id)}>
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2"><RoleBadge role={doc.userRole} /></div>

      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-auto">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(doc.updatedAt)}</span>
        {doc.owner && doc.userRole !== "owner" && (
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{doc.owner.name}</span>
        )}
      </div>

      {isDeleting && (
        <div className="absolute inset-0 rounded-xl bg-[var(--bg-card)]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 animate-fade-in z-30"
          onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-[var(--text-primary)] text-center font-medium">Delete &ldquo;{truncate(doc.title, 30)}&rdquo;?</p>
          <p className="text-xs text-[var(--text-muted)] text-center">This action cannot be undone.</p>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs py-1.5 px-3" onClick={onCancelDelete}><X className="w-3.5 h-3.5" /> Cancel</button>
            <button className="btn-danger text-xs py-1.5 px-3" onClick={() => onConfirmDelete(doc._id)}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
          </div>
        </div>
      )}

      {!isRenaming && !isDeleting && !isMenuOpen && (
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
      )}
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-lg" />
        <div className="skeleton h-4 flex-1 rounded" />
      </div>
      <div className="skeleton h-5 w-20 rounded-full" />
      <div className="skeleton h-3 w-24 rounded mt-2" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [shareDoc, setShareDoc] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getStoredToken();
    if (!storedUser || !token) { router.replace("/login"); return; }
    setUser(storedUser);
    loadDocuments();
  }, [router]);

  const loadDocuments = async () => {
    try {
      setLoading(true); setError("");
      const res = await fetchDocuments();
      setDocuments(res.data.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents. Please refresh.");
    } finally { setLoading(false); }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true); setError("");
    try {
      const res = await createDocument({ title: newTitle.trim() || "Untitled Document" });
      const newDoc = res.data.document;
      setDocuments((prev) => [newDoc, ...prev]);
      setShowNewModal(false); setNewTitle("");
      router.push(`/documents/${newDoc._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create document.");
    } finally { setCreating(false); }
  };

  // ── Import files → create a new document with content ─────────────────────
  const handleImportClick = () => { setError(""); fileInputRef.current?.click(); };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("File too large (max 10 MB)."); return; }

    const name = file.name.toLowerCase();
    const ext = name.split(".").pop();
    const supported = ["docx", "txt", "md", "markdown", "odt"];
    if (!supported.includes(ext)) {
      setError(`Unsupported format (.${ext}). Supported: .docx, .txt, .md, .odt`);
      return;
    }

    setImporting(true); setError("");
    try {
      let html = "";
      const title = file.name.replace(/\.[^.]+$/, "") || "Imported Document";

      if (ext === "docx") {
        const mammoth = await import("mammoth/mammoth.browser");
        const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        html = result.value;
      } else if (ext === "odt") {
        const mammoth = await import("mammoth/mammoth.browser");
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
          html = result.value;
        } catch {
          const text = await file.text();
          html = text.split(/\r?\n/).map((l) => l.trim() ? `<p>${l.replace(/</g,"&lt;")}</p>` : "<p><br></p>").join("");
        }
      } else {
        // .txt, .md, .markdown — plain text → HTML paragraphs
        const text = await file.text();
        html = text.split(/\r?\n/).map((l) => l.trim() ? `<p>${l.replace(/</g,"&lt;")}</p>` : "<p><br></p>").join("");
      }

      const res = await createDocument({ title });
      const newDoc = res.data.document;
      await updateDocument(newDoc._id, { content: html || "<p><br></p>" });
      router.push(`/documents/${newDoc._id}/view`);
    } catch (err) {
      setError("Could not import that file. Please try a different format.");
      setImporting(false);
    }
  };

  const handleDelete = useCallback(async (docId) => {
    try {
      await deleteDocument(docId);
      setDeletingId(null);
      setRemovingId(docId);
      setTimeout(() => {
        setDocuments((prev) => prev.filter((d) => d._id !== docId));
        setRemovingId(null);
      }, 280);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete document.");
    }
  }, []);

  const handleRenameSubmit = useCallback(async (docId) => {
    const value = renameValue.trim();
    if (!value) { setRenamingId(null); return; }
    try {
      await updateDocument(docId, { title: value });
      setDocuments((prev) => prev.map((d) => (d._id === docId ? { ...d, title: value } : d)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to rename document.");
    } finally { setRenamingId(null); }
  }, [renameValue]);

  const openDoc = useCallback((doc) => router.push(`/documents/${doc._id}/view`), [router]);
  const toggleMenu = useCallback((id) => setOpenMenuId((cur) => (id === cur ? null : id)), []);
  const startRename = useCallback((doc) => { setRenamingId(doc._id); setRenameValue(doc.title); setOpenMenuId(null); }, []);
  const startShare = useCallback((doc) => { setShareDoc(doc); setOpenMenuId(null); }, []);
  const askDelete = useCallback((id) => { setDeletingId(id); setOpenMenuId(null); }, []);

  const filteredDocs = documents.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const ownedDocs = filteredDocs.filter((d) => d.userRole === "owner");
  const sharedDocs = filteredDocs.filter((d) => d.userRole !== "owner");

  const recentCount = documents.filter((d) => (Date.now() - new Date(d.updatedAt)) < 86400000).length;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const renderCard = (doc) => (
    <DocumentCard key={doc._id} doc={doc}
      isMenuOpen={openMenuId === doc._id} isRenaming={renamingId === doc._id} renameValue={renameValue}
      isDeleting={deletingId === doc._id} isRemoving={removingId === doc._id}
      onOpen={openDoc} onToggleMenu={toggleMenu} onStartRename={startRename}
      onRenameChange={setRenameValue} onRenameSubmit={handleRenameSubmit} onCancelRename={() => setRenamingId(null)}
      onStartShare={startShare} onAskDelete={askDelete} onCancelDelete={() => setDeletingId(null)} onConfirmDelete={handleDelete} />
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Welcome + quick actions */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Welcome back, {user ? user.name.split(" ")[0] : "there"} 👋
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".docx,.txt,.md,.markdown,.odt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.oasis.opendocument.text"
              onChange={handleFileSelected} className="hidden" aria-hidden="true" tabIndex={-1} />
            <button onClick={handleImportClick} disabled={importing} className="btn-secondary">
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <><Upload className="w-4 h-4" /> Import</>}
            </button>
            <button onClick={() => setShowNewModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> New Document
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FileStack} label="Total Documents" value={documents.length} tone={{ bg: "rgba(124,58,237,0.12)", fg: "#7C3AED" }} />
          <StatCard icon={Crown} label="Owned by Me" value={documents.filter((d) => d.userRole === "owner").length} tone={{ bg: "rgba(219,39,119,0.12)", fg: "#DB2777" }} />
          <StatCard icon={Share} label="Shared With Me" value={documents.filter((d) => d.userRole !== "owner").length} tone={{ bg: "rgba(245,158,11,0.14)", fg: "#D97706" }} />
          <StatCard icon={Activity} label="Edited Today" value={recentCount} tone={{ bg: "rgba(16,185,129,0.12)", fg: "#10B981" }} />
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input type="text" placeholder="Search documents…" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-9 py-2.5 text-sm" />
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-error shrink-0" />
            <p className="text-error text-sm">{error}</p>
            <button onClick={() => setError("")} className="ml-auto text-error/60 hover:text-error"><X className="w-4 h-4" /></button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center border border-[var(--border)]">
              <FileText className="w-9 h-9 text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">No documents yet</h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1">Create your first document to start collaborating</p>
            </div>
            <button onClick={() => setShowNewModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create First Document</button>
          </div>
        ) : (
          <div className="space-y-8">
            {ownedDocs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">My Documents ({ownedDocs.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{ownedDocs.map(renderCard)}</div>
              </section>
            )}
            {sharedDocs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Shared with Me ({sharedDocs.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{sharedDocs.map(renderCard)}</div>
              </section>
            )}
            {filteredDocs.length === 0 && searchQuery && (
              <div className="text-center py-16">
                <p className="text-[var(--text-secondary)]">No documents matching &ldquo;<span className="text-[var(--text-primary)]">{searchQuery}</span>&rdquo;</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewModal(false); }}>
          <div className="card w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center"><Plus className="w-4 h-4 text-[var(--accent)]" /></div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">New Document</h2>
              </div>
              <button onClick={() => setShowNewModal(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Document Title</label>
                <input autoFocus type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Untitled Document" className="input-field" maxLength={200} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Check className="w-4 h-4" /> Create</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {shareDoc && <ShareModal doc={shareDoc} onClose={() => setShareDoc(null)} onShared={() => loadDocuments()} />}
    </div>
  );
}
