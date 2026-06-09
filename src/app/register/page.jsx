"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, FileText, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { registerUser } from "@/lib/api";
import { storeAuth, isAuthenticated } from "@/lib/auth";

function strengthOf(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const STR = [
  { label: "Too short", color: "#F43F5E" },
  { label: "Weak", color: "#F59E0B" },
  { label: "Fair", color: "#F59E0B" },
  { label: "Good", color: "#A78BFA" },
  { label: "Strong", color: "#10B981" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  useEffect(() => {
    if (isAuthenticated()) router.replace("/dashboard");
  }, [router]);

  const strength = useMemo(() => strengthOf(form.password), [form.password]);

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!form.email || !form.password) return setError("Please fill in all fields.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      const res = await registerUser({ name: form.name, email: form.email, password: form.password });
      storeAuth(res.data.user, res.data.token);
      setSuccess("Account created!");
      setTimeout(() => router.push("/dashboard"), 400);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left — branding */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden register-brand-panel">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute top-32 right-16 w-80 h-80 rounded-full bg-white/5 blur-[100px]" />
          <div className="absolute bottom-16 left-10 w-64 h-64 rounded-full bg-amber-500/10 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>

        <Link href="/" className="relative flex items-center gap-2.5 text-white">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <FileText className="w-5 h-5" />
          </span>
          <span className="text-xl font-black tracking-tight">CollabDoc</span>
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-black text-white leading-[1.1]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Start creating<br /><span className="italic text-pink-300">remarkable</span> work.
          </h2>
          <p className="mt-5 text-white/70 text-lg leading-relaxed max-w-sm">
            Free forever. No credit card. Set up your workspace in seconds and invite your whole team.
          </p>
        </div>

        <p className="relative text-sm text-white/40">© 2026 CollabDoc</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-[var(--bg-primary)]">
        <div className="w-full max-w-sm animate-slide-up">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>

          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white">
              <FileText className="w-5 h-5" />
            </span>
            <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">CollabDoc</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Create account
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">Free forever. No credit card needed.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Full name</label>
              <input id="name" type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="Jane Doe" autoComplete="name" className="input-field" disabled={loading} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Email</label>
              <input id="email" type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" autoComplete="email" className="input-field" disabled={loading} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} name="password" value={form.password}
                  onChange={handleChange} placeholder="Min. 6 characters" autoComplete="new-password"
                  className="input-field pr-11" disabled={loading} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2.5">
                  <div className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} className="h-1 flex-1 rounded-full transition-colors"
                        style={{ backgroundColor: i < strength ? STR[strength].color : "var(--border)" }} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs font-medium" style={{ color: STR[strength].color }}>{STR[strength].label}</p>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Confirm password</label>
              <input id="confirm" type={showPassword ? "text" : "password"} name="confirm" value={form.confirm}
                onChange={handleChange} placeholder="Re-enter password" autoComplete="new-password"
                className="input-field" disabled={loading} />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-[var(--destructive)] mt-0.5 shrink-0" />
                <p className="text-[var(--destructive)] text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-emerald-400 text-sm">{success}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base rounded-xl">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
