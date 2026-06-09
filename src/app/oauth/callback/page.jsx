"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { storeAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

function OAuthHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");
    const error = searchParams.get("error");

    if (error || !token || !userParam) {
      window.location.href = "/login?error=oauth_failed";
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      storeAuth(user, token);
      window.location.href = "/dashboard";
    } catch {
      window.location.href = "/login?error=oauth_failed";
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-[var(--text-secondary)] text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Loading…</p>
        </div>
      </div>
    }>
      <OAuthHandler />
    </Suspense>
  );
}
