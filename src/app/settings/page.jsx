"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Lock, Palette, Sun, Moon, Check,
  Loader2, AlertCircle, CheckCircle2, FileText,
} from "lucide-react";
import { updateProfile } from "@/lib/api";
import { getStoredUser, getStoredToken, storeAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { getInitials } from "@/lib/utils";

const AVATAR_COLORS = [
  "#7C3AED", "#DB2777", "#F59E0B", "#10B981",
  "#3B82F6", "#EF4444", "#EC4899", "#06B6D4",
  "#8B5CF6", "#F97316", "#14B8A6", "#84CC16",
];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--accent-subtle)]">
          <Icon className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium animate-slide-up
      ${type === "success" ? "bg-[var(--bg-card)] border-emerald-500/30 text-emerald-400" : "bg-[var(--bg-card)] border-red-500/30 text-[var(--destructive)]"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();

  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Profile form
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Avatar color
  const [avatarColor, setAvatarColor] = useState("");
  const [savingColor, setSavingColor] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const u = getStoredUser();
    const t = getStoredToken();
    if (!u || !t) { router.replace("/login"); return; }
    setUser(u);
    setName(u.name || "");
    setAvatarColor(u.avatarColor || "#7C3AED");
  }, [router]);

  const saveProfile = async () => {
    if (!name.trim() || name.trim() === user?.name) return;
    setSavingProfile(true);
    try {
      const res = await updateProfile({ name: name.trim() });
      const updated = res.data.user;
      storeAuth(updated, getStoredToken());
      setUser(updated);
      showToast("Name updated successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update name.", "error");
    } finally { setSavingProfile(false); }
  };

  const savePassword = async () => {
    if (!passwords.current || !passwords.next) return showToast("All password fields are required.", "error");
    if (passwords.next.length < 6) return showToast("New password must be at least 6 characters.", "error");
    if (passwords.next !== passwords.confirm) return showToast("New passwords don't match.", "error");
    setSavingPassword(true);
    try {
      await updateProfile({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: "", next: "", confirm: "" });
      showToast("Password changed successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password.", "error");
    } finally { setSavingPassword(false); }
  };

  const saveColor = async (color) => {
    setAvatarColor(color);
    setSavingColor(true);
    try {
      const res = await updateProfile({ avatarColor: color });
      const updated = res.data.user;
      storeAuth(updated, getStoredToken());
      setUser(updated);
      showToast("Avatar color updated.");
    } catch (err) {
      showToast("Failed to update avatar color.", "error");
    } finally { setSavingColor(false); }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <Loader2 className="w-7 h-7 text-[var(--accent)] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/dashboard" className="btn-ghost p-2" aria-label="Back to dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]"
              style={{ fontFamily: "'Playfair Display', serif" }}>Settings</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your account and preferences</p>
          </div>
        </div>

        {/* Profile preview */}
        <div className="card p-6 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0 shadow-lg"
            style={{ backgroundColor: avatarColor, boxShadow: `0 8px 24px ${avatarColor}50` }}>
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-[var(--text-primary)] truncate">{user.name}</p>
            <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ── Display name ───────────────────────────────────────────── */}
          <Section icon={User} title="Display Name">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Full name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" maxLength={60} className="input-field"
                  onKeyDown={(e) => e.key === "Enter" && saveProfile()} />
                <p className="mt-1.5 text-xs text-[var(--text-muted)]">This is how you appear to collaborators.</p>
              </div>
              <button onClick={saveProfile} disabled={savingProfile || !name.trim() || name.trim() === user.name}
                className="btn-primary disabled:opacity-40">
                {savingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Save Name</>}
              </button>
            </div>
          </Section>

          {/* ── Avatar color ────────────────────────────────────────────── */}
          <Section icon={Palette} title="Avatar Color">
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">Pick a color for your avatar across all documents.</p>
              <div className="flex flex-wrap gap-3">
                {AVATAR_COLORS.map((c) => (
                  <button key={c} onClick={() => saveColor(c)} aria-label={`Select color ${c}`}
                    className="w-9 h-9 rounded-xl transition-all duration-200 hover:scale-110 focus:outline-none relative"
                    style={{ backgroundColor: c, boxShadow: avatarColor === c ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${c}` : "none" }}>
                    {avatarColor === c && <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                  </button>
                ))}
              </div>
              {savingColor && <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</p>}
            </div>
          </Section>

          {/* ── Appearance / Theme ──────────────────────────────────────── */}
          <Section icon={isDark ? Moon : Sun} title="Appearance">
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">Choose between light and dark theme.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => !isDark || toggleTheme()}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200
                    ${!isDark ? "border-[var(--accent)] bg-[var(--accent-subtle)]" : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]"}`}>
                  <div className="w-full h-14 rounded-lg bg-[#FBFAFF] border border-gray-200 flex items-center justify-center">
                    <span className="w-8 h-2 rounded bg-gray-300" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sun className={`w-4 h-4 ${!isDark ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                    <span className={`text-sm font-semibold ${!isDark ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>Light</span>
                    {!isDark && <Check className="w-3.5 h-3.5 text-[var(--accent)] ml-1" />}
                  </div>
                </button>

                <button onClick={() => isDark || toggleTheme()}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200
                    ${isDark ? "border-[var(--accent)] bg-[var(--accent-subtle)]" : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]"}`}>
                  <div className="w-full h-14 rounded-lg bg-[#0A0612] border border-[#2A1F44] flex items-center justify-center">
                    <span className="w-8 h-2 rounded bg-[#3D2E5E]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Moon className={`w-4 h-4 ${isDark ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                    <span className={`text-sm font-semibold ${isDark ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>Dark</span>
                    {isDark && <Check className="w-3.5 h-3.5 text-[var(--accent)] ml-1" />}
                  </div>
                </button>
              </div>
            </div>
          </Section>

          {/* ── Change password ─────────────────────────────────────────── */}
          <Section icon={Lock} title="Change Password">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Current password</label>
                <input type={showPasswords ? "text" : "password"} value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                  placeholder="••••••••" autoComplete="current-password" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">New password</label>
                <input type={showPasswords ? "text" : "password"} value={passwords.next}
                  onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                  placeholder="Min. 6 characters" autoComplete="new-password" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Confirm new password</label>
                <input type={showPasswords ? "text" : "password"} value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password" autoComplete="new-password" className="input-field" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer select-none">
                  <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)}
                    className="w-4 h-4 rounded" />
                  Show passwords
                </label>
              </div>
              <button onClick={savePassword} disabled={savingPassword || !passwords.current || !passwords.next || !passwords.confirm}
                className="btn-primary disabled:opacity-40">
                {savingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Changing…</> : <><Lock className="w-4 h-4" /> Change Password</>}
              </button>
            </div>
          </Section>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
