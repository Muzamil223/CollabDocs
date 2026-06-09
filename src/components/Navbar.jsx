"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText, Menu, X, Bell, ChevronDown,
  LayoutDashboard, Files, Settings, LogOut,
  UserPlus, RefreshCw, CheckCheck, Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { getInitials, formatDate } from "@/lib/utils";
import { connectSocket, resetSocket } from "@/lib/socket";
import {
  fetchNotifications, markNotificationsRead, clearReadNotifications,
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="CollabDoc home">
      <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/20 transition-transform duration-200 group-hover:scale-105">
        <FileText className="w-5 h-5" />
      </span>
      <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">
        CollabDoc
      </span>
    </Link>
  );
}

/* ── User dropdown ────────────────────────────────────────────────────────── */
function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: user.avatarColor || "#7C3AED" }}>
          {getInitials(user.name)}
        </span>
        <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">{user.name}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl shadow-black/20 py-1.5 animate-slide-up z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: user.avatarColor || "#7C3AED" }}>
                {getInitials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <Link href="/settings" onClick={() => setOpen(false)} role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </Link>

          <div className="my-1 h-px bg-[var(--border)]" />

          <button onClick={() => { setOpen(false); onLogout(); }} role="menuitem"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--destructive)] hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Notification bell ────────────────────────────────────────────────────── */
function NotificationBell({ isAuthenticated }) {
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]         = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch from DB on mount (when logged in)
  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetchNotifications();
      setNotifications(res.data.notifications || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  // Real-time: listen for new-notification via socket
  useEffect(() => {
    if (!isAuthenticated || !getStoredToken()) return;
    const socket = connectSocket();

    const onNew = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    socket.on("new-notification", onNew);
    return () => { socket.off("new-notification", onNew); };
  }, [isAuthenticated]);

  const unread = notifications.filter((n) => !n.read).length;

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead(); // no ids → mark all
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const handleClearRead = async () => {
    try {
      await clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus:outline-none"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-card)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl animate-slide-up z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Notifications
              {unread > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-xs font-bold">
                  {unread}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all read"
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleClearRead}
                title="Clear read"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={load}
                title="Refresh"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                You&apos;re all caught up.
              </div>
            ) : (
              notifications.map((n, i) => (
                <NotificationItem
                  key={n._id || i}
                  notification={n}
                  onRead={() => {
                    markNotificationsRead([n._id]).catch(() => {});
                    setNotifications((prev) =>
                      prev.map((x) => x._id === n._id ? { ...x, read: true } : x)
                    );
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification: n, onRead }) {
  const router = useRouter ? useRouter() : null;

  const handleClick = () => {
    onRead();
    if (n.documentId && router) {
      router.push(`/documents/${n.documentId}/view`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 transition-colors
        ${n.read ? "hover:bg-[var(--bg-hover)]" : "bg-violet-500/5 hover:bg-violet-500/10"}`}
    >
      {/* Avatar */}
      <span
        className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: n.fromUser?.avatarColor || "#7C3AED" }}
      >
        {n.fromUser?.name ? getInitials(n.fromUser.name) : <UserPlus className="w-3.5 h-3.5" />}
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${n.read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)] font-medium"}`}>
          {n.message}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {n.createdAt ? formatDate(n.createdAt) : ""}
        </p>
      </div>

      {!n.read && (
        <span className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 shrink-0" />
      )}
    </button>
  );
}

const PUBLIC_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
];

const AUTH_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: Files },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 glass-panel border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-1">
              {AUTH_LINKS.map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${pathname === href ? "text-[var(--accent)] bg-[var(--accent-subtle)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}>
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
              <div className="w-px h-6 bg-[var(--border)] mx-2" />
              <NotificationBell isAuthenticated={isAuthenticated} />
              <UserDropdown user={user} onLogout={logout} />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6">
              {PUBLIC_LINKS.map(({ label, href }) => (
                <Link key={label} href={href}
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  {label}
                </Link>
              ))}
              <Link href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Log In
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Get Started Free
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center">
            <button onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={mobileOpen}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 flex flex-col gap-1 animate-fade-in">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 px-2 py-3 mb-1 border-b border-[var(--border)]">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: user.avatarColor || "#7C3AED" }}>
                  {getInitials(user.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                </div>
              </div>
              {AUTH_LINKS.map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
              <Link href="/settings"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <div className="h-px bg-[var(--border)] my-1" />
              <button onClick={logout}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[var(--destructive)] hover:bg-red-500/10 transition-colors text-left">
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </>
          ) : (
            <>
              {PUBLIC_LINKS.map(({ label, href }) => (
                <Link key={label} href={href}
                  className="px-3 py-3 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
                  {label}
                </Link>
              ))}
              <div className="h-px bg-[var(--border)] my-2" />
              <Link href="/login"
                className="px-3 py-3 rounded-lg text-sm font-medium text-center text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                Log In
              </Link>
              <Link href="/register" className="btn-primary w-full py-3 text-center">
                Get Started Free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
