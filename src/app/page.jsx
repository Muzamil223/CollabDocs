import Link from "next/link";
import {
  FileText, MessageSquare, History, ShieldCheck, FileDown, Bell,
  ArrowRight, Check, Star, Users, Zap, Sparkles, ArrowUpRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   HERO — Cinematic. Rich serif headline. 3D floating card. Animated gradient.
   ───────────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Animated gradient backdrop */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--bg-primary)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[1000px] opacity-40"
          style={{ background: "conic-gradient(from 180deg at 50% 50%, #7C3AED22 0deg, #DB277722 120deg, #F59E0B18 240deg, #7C3AED22 360deg)", filter: "blur(100px)" }} />
        <div className="absolute top-20 right-[15%] w-72 h-72 rounded-full bg-violet-500/10 blur-[100px] animate-blob" />
        <div className="absolute bottom-32 left-[10%] w-80 h-80 rounded-full bg-pink-500/8 blur-[120px] animate-blob" style={{ animationDelay: "5s" }} />
      </div>

      {/* Grid noise texture overlay */}
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.015]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          {/* Left — Copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/60 backdrop-blur-sm px-4 py-2 text-sm text-[var(--text-secondary)] mb-8 animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Trusted by 10,000+ teams
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight animate-slide-up"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              <span className="text-[var(--text-primary)]">Where ideas</span>
              <br />
              <span className="italic bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                come alive
              </span>
              <br />
              <span className="text-[var(--text-primary)]">together.</span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed max-w-md animate-slide-up" style={{ animationDelay: "0.08s" }}>
              The collaborative editor for teams who refuse to compromise on craft.
              Write, comment, and ship — in perfect sync.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4 animate-slide-up" style={{ animationDelay: "0.14s" }}>
              <Link href="/register" className="group btn-primary text-base px-7 py-4 rounded-xl">
                Start creating <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/#features" className="inline-flex items-center gap-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-4">
                Explore features <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="mt-5 text-sm text-[var(--text-muted)] animate-slide-up" style={{ animationDelay: "0.18s" }}>
              Free forever · No credit card · Setup in 30 seconds
            </p>
          </div>

          {/* Right — 3D floating card */}
          <div className="relative animate-slide-up" style={{ animationDelay: "0.2s", perspective: "1200px" }}>
            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-xl shadow-2xl overflow-hidden"
              style={{ transform: "rotateY(-4deg) rotateX(2deg)", transformStyle: "preserve-3d" }}>
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <span className="w-3 h-3 rounded-full bg-[#28C840]" />
                <span className="flex-1 text-center text-xs text-[var(--text-muted)] font-medium">Product Strategy — Q3 2026</span>
                <div className="flex -space-x-1.5">
                  {[["M", "#7C3AED"], ["S", "#DB2777"], ["K", "#F59E0B"]].map(([i, c]) => (
                    <span key={i} className="w-5 h-5 rounded-full ring-2 ring-[var(--bg-card)] flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: c }}>{i}</span>
                  ))}
                </div>
              </div>

              {/* Document body mock */}
              <div className="p-6 sm:p-8 space-y-4">
                <div className="h-7 w-3/4 rounded-md bg-[var(--text-primary)]/8" />
                <div className="space-y-2.5">
                  <div className="h-3 w-full rounded bg-[var(--border)]" />
                  <div className="h-3 w-[95%] rounded bg-[var(--border)]" />
                  <div className="h-3 w-[88%] rounded bg-[var(--border)]" />
                  <div className="h-3 w-[75%] rounded bg-[var(--border)]" />
                </div>
                <div className="h-5 w-1/3 rounded-md bg-[var(--text-primary)]/8 mt-6" />
                <div className="space-y-2.5">
                  <div className="h-3 w-full rounded bg-[var(--border)]" />
                  <div className="h-3 w-[92%] rounded bg-[var(--border)]" />
                  <div className="h-3 w-[80%] rounded bg-[var(--border)]" />
                </div>
                {/* Cursor indicator */}
                <div className="flex items-center gap-2 pt-3">
                  <span className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-[8px] font-bold text-white shadow-lg shadow-pink-500/30">S</span>
                  <span className="text-xs italic text-[var(--text-muted)]">Sarah is editing…</span>
                  <span className="w-0.5 h-4 bg-pink-400 animate-pulse rounded-full ml-1" />
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)]/40">
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Synced
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">3 collaborators · 2.4k words</span>
              </div>
            </div>

            {/* Floating elements — 3D depth */}
            <div className="absolute -top-6 -right-4 w-20 h-20 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-xl shadow-xl flex items-center justify-center animate-float"
              style={{ transform: "translateZ(60px) rotateY(8deg)", animationDelay: "0.5s" }}>
              <MessageSquare className="w-7 h-7 text-violet-400" />
            </div>
            <div className="absolute -bottom-4 -left-6 w-16 h-16 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-xl shadow-xl flex items-center justify-center animate-float"
              style={{ transform: "translateZ(40px) rotateY(-5deg)", animationDelay: "1.5s" }}>
              <History className="w-6 h-6 text-amber-400" />
            </div>
            <div className="absolute top-1/2 -left-10 w-14 h-14 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-xl shadow-xl flex items-center justify-center animate-float"
              style={{ transform: "translateZ(50px)", animationDelay: "2.5s" }}>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Logo marquee — social proof ──────────────────────────────────────────── */
function LogoCloud() {
  const brands = ["Northwind", "Loopt", "Brightpath", "Velora", "Synctive", "Arclight"];
  return (
    <section className="border-y border-[var(--border)] py-10 overflow-hidden">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-8">
        Trusted by forward-thinking teams
      </p>
      <div className="flex items-center justify-center gap-12 flex-wrap px-6 opacity-50">
        {brands.map((b) => (
          <span key={b} className="text-lg font-bold tracking-tight text-[var(--text-muted)]" style={{ fontFamily: "'Playfair Display', serif" }}>{b}</span>
        ))}
      </div>
    </section>
  );
}

/* ── Features — editorial grid ────────────────────────────────────────────── */
const FEATURES = [
  { icon: Zap, title: "Real-Time Sync", desc: "Every keystroke synchronized instantly across all connected users. No lag, no conflicts.", color: "#A78BFA" },
  { icon: MessageSquare, title: "Contextual Comments", desc: "Threaded discussions right where the conversation belongs — inside the document.", color: "#F472B6" },
  { icon: History, title: "Version History", desc: "Every save is preserved. Restore any previous state with a single click.", color: "#FBBF24" },
  { icon: ShieldCheck, title: "Role-Based Access", desc: "Owner, Editor, Viewer — granular control over who reads and who writes.", color: "#34D399" },
  { icon: FileDown, title: "Universal Export", desc: "Download your work as PDF or DOCX. Import existing .docx and .odt files.", color: "#60A5FA" },
  { icon: Bell, title: "Live Notifications", desc: "Instant alerts when someone comments, edits, or shares a document with you.", color: "#FB923C" },
];

function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Capabilities</p>
        <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-[1.1]"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Crafted for teams<br />who ship great work.
        </h2>
        <p className="mt-5 text-lg text-[var(--text-secondary)] max-w-lg">
          Everything you need to go from first draft to published — without switching tools.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="group relative p-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 backdrop-blur-sm hover:border-[var(--border-strong)] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            {/* Glow on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(ellipse at 30% 0%, ${color}12 0%, transparent 70%)` }} />
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-5"
                style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── How it works — elegant 3-step ───────────────────────────────────────── */
const STEPS = [
  { n: "01", title: "Create", desc: "Start with a blank canvas or import an existing document in one click." },
  { n: "02", title: "Invite", desc: "Share by email with fine-grained permissions — Owner, Editor, or Viewer." },
  { n: "03", title: "Collaborate", desc: "Edit together in real-time, comment inline, and watch ideas evolve live." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: "radial-gradient(circle, var(--text-primary) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">How It Works</p>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Three steps to<br /><span className="italic">effortless</span> collaboration.
          </h2>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[var(--accent)] text-[var(--accent)] text-xl font-black mb-6 group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-300"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {n}
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h3>
              <p className="text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stats — impactful numbers ────────────────────────────────────────────── */
function Stats() {
  const stats = [
    { num: "10K+", label: "Documents Created" },
    { num: "50K+", label: "Edits Synced Daily" },
    { num: "99.9%", label: "Uptime" },
    { num: "4.9★", label: "Average Rating" },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map(({ num, label }) => (
          <div key={label} className="text-center">
            <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent"
              style={{ fontFamily: "'Playfair Display', serif" }}>{num}</p>
            <p className="mt-2 text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Testimonials — elegant cards ─────────────────────────────────────────── */
const TESTIMONIALS = [
  { quote: "CollabDoc replaced three tools for us. The real-time editing is flawless — it just disappears and lets you focus on writing.", name: "Sarah Chen", role: "Head of Product, Northwind", avatar: "#7C3AED" },
  { quote: "The cleanest collaborative experience we've found. Comments, roles, and version history make document reviews painless.", name: "Marcus Reid", role: "Engineering Lead, Loopt", avatar: "#DB2777" },
  { quote: "We onboarded our entire team in under five minutes. Importing our old docs was effortless. It just works.", name: "Aisha Khan", role: "Operations Director, Brightpath", avatar: "#F59E0B" },
];

function Testimonials() {
  return (
    <section className="bg-[var(--bg-secondary)] border-y border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Testimonials</p>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Loved by teams who<br />care about <span className="italic">craft</span>.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, role, avatar }) => (
            <figure key={name} className="p-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/60 backdrop-blur-sm flex flex-col">
              <div className="flex gap-1 text-amber-400 mb-5">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <blockquote className="text-[var(--text-primary)] leading-relaxed flex-1 text-[15px]">&ldquo;{quote}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-[var(--border)]">
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: avatar }}>
                  {name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA — cinematic ──────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <div className="relative overflow-hidden rounded-3xl p-12 sm:p-16 lg:p-20 text-center"
        style={{ background: "linear-gradient(135deg, #1E0533 0%, #4C1D95 35%, #7C3AED 70%, #DB2777 100%)" }}>
        {/* Light sweep */}
        <div aria-hidden className="absolute inset-0 opacity-25"
          style={{ background: "radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)" }} />
        <div aria-hidden className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to create<br />something <span className="italic">remarkable</span>?
          </h2>
          <p className="mt-6 text-lg text-white/80 max-w-lg mx-auto">
            Join thousands of teams already shipping better work together.
          </p>
          <Link href="/register"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white text-gray-900 font-bold px-8 py-4 text-base hover:bg-white/90 transition-all active:scale-[0.97] shadow-2xl shadow-black/20">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-4 text-sm text-white/60">No credit card required</p>
        </div>
      </div>
    </section>
  );
}

/* ── Footer — clean and rich ──────────────────────────────────────────────── */
function Footer() {
  const cols = [
    { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
  ];
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/20">
                <FileText className="w-5 h-5" />
              </span>
              <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">
                CollabDoc
              </span>
            </div>
            <p className="mt-5 text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">
              The collaborative document editor for teams who care about craft, speed, and beautiful work.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">{c.title}</h4>
              <ul className="space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">© 2026 CollabDoc. All rights reserved.</p>
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
            Crafted with <span className="text-pink-400">♥</span> for teams that ship
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ── Page export ──────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
