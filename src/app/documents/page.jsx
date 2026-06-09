"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, FileText, FileX, MoreHorizontal, Plus, ChevronDown,
} from "lucide-react";
import { fetchDocuments, fetchDocument, deleteDocument } from "@/lib/api";
import { getStoredUser, getStoredToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { exportAsPDF, exportAsDOCX } from "@/lib/exportDocument";

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  if (role === "owner") {
    return <span className="badge-owner">Owner</span>;
  }
  if (role === "edit") {
    return <span className="badge-editor">Editor</span>;
  }
  return <span className="badge-viewer">Viewer</span>;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-[var(--bg-card)] rounded-xl h-44 border border-[var(--border)]" />
  );
}

// ─── Document card ────────────────────────────────────────────────────────────
function DocumentCard({ doc, onDelete, onExportPDF, onExportDOCX }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(null); // 'pdf' | 'docx' | null
  const menuRef = useRef(null);
  const isOwner = doc.userRole === "owner";

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCardClick = (e) => {
    // Don't navigate if clicking the three-dot area
    if (menuRef.current && menuRef.current.contains(e.target)) return;
    router.push(`/documents/${doc._id}/view`);
  };

  const handleExport = async (type) => {
    setMenuOpen(false);
    setExporting(type);
    try {
      await (type === "pdf" ? onExportPDF(doc._id) : onExportDOCX(doc._id));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border-strong)] transition-colors duration-200 cursor-pointer group flex flex-col justify-between h-44"
    >
      {/* Top section */}
      <div>
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center mb-3">
          <FileText className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 leading-snug mb-1.5">
          {doc.title}
        </h3>
        {doc.userRole && <RoleBadge role={doc.userRole} />}
      </div>

      {/* Bottom section */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--text-muted)]">
          {exporting ? (exporting === "pdf" ? "Exporting PDF…" : "Exporting DOCX…") : formatDate(doc.updatedAt)}
        </span>

        {/* Three-dot menu */}
        <div
          ref={menuRef}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Document options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); router.push(`/documents/${doc._id}/view`); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors duration-200 text-left"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                Open
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors duration-200 text-left"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                Export PDF
              </button>
              <button
                onClick={() => handleExport("docx")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors duration-200 text-left"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                Export DOCX
              </button>
              {isOwner && (
                <>
                  <div className="border-t border-[var(--border)]" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(doc._id, doc.title); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--destructive)] hover:bg-[var(--bg-hover)] transition-colors duration-200 text-left"
                  >
                    <FileX className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Documents listing page ───────────────────────────────────────────────────
export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "mine" | "shared"
  const [sort, setSort] = useState("updated"); // "updated" | "created" | "asc" | "desc"
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }

  // Auth guard
  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getStoredToken();
    if (!storedUser || !token) {
      router.replace("/login");
      return;
    }
    setUser(storedUser);
    loadDocuments();
  }, [router]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetchDocuments();
      setDocuments(res.data.documents || []);
    } catch {
      // silently fail — empty state will show
    } finally {
      setLoading(false);
    }
  };

  // Export helpers — fetch content first, then export
  const handleExportPDF = useCallback(async (docId) => {
    try {
      const res = await fetchDocument(docId);
      const doc = res.data.document;
      await exportAsPDF(doc.content || "", doc.title || "document");
    } catch {
      // ignore
    }
  }, []);

  const handleExportDOCX = useCallback(async (docId) => {
    try {
      const res = await fetchDocument(docId);
      const doc = res.data.document;
      await exportAsDOCX(doc.content || "", doc.title || "document");
    } catch {
      // ignore
    }
  }, []);

  // Delete flow
  const askDelete = (id, title) => {
    setDeleteTarget({ id, title });
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d._id !== deleteTarget.id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  // Filter + sort
  const filtered = documents
    .filter((d) => {
      if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeTab === "mine") return d.userRole === "owner";
      if (activeTab === "shared") return d.userRole !== "owner";
      return true;
    })
    .sort((a, b) => {
      if (sort === "updated") return new Date(b.updatedAt) - new Date(a.updatedAt);
      if (sort === "created") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "asc") return a.title.localeCompare(b.title);
      if (sort === "desc") return b.title.localeCompare(a.title);
      return 0;
    });

  const tabs = [
    { key: "all", label: "All" },
    { key: "mine", label: "My Documents" },
    { key: "shared", label: "Shared with Me" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ── Page heading ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">All Documents</h1>
        <p className="text-[var(--text-secondary)] mt-1">Browse, search, and export every document you can access.</p>
      </div>

      {/* ── Filter & Sort bar ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-3 max-w-7xl mx-auto">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors duration-200"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                activeTab === key
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/30"
                  : "text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="sm:ml-auto relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none text-xs pl-3 pr-7 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]/50 cursor-pointer transition-colors duration-200"
          >
            <option value="updated">Last Modified</option>
            <option value="created">Created Date</option>
            <option value="asc">Title A–Z</option>
            <option value="desc">Title Z–A</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
        </div>
      </div>

      {/* ── Document grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <FileX className="w-12 h-12 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)] font-medium">
              {search ? `No documents matching "${search}"` : "No documents yet"}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              Create Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((doc) => (
              <DocumentCard
                key={doc._id}
                doc={doc}
                onDelete={askDelete}
                onExportPDF={handleExportPDF}
                onExportDOCX={handleExportDOCX}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirm dialog ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-primary)]/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeletingId(null);
              setDeleteTarget(null);
            }
          }}
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-[var(--text-primary)] font-medium mb-2">Delete document?</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              &ldquo;{deleteTarget.title}&rdquo; will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeletingId(null); setDeleteTarget(null); }}
                className="flex-1 text-sm px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 text-sm px-4 py-2 rounded-lg bg-[var(--destructive)]/10 hover:bg-[var(--destructive)]/20 border border-[var(--destructive)]/30 text-[var(--destructive)] transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
