"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Render the Navbar only on the client — it reads localStorage (auth state,
// theme) which doesn't exist on the server. SSR would always produce a
// "logged-out" snapshot that mismatches the real client state, causing the
// hydration error. Disabling SSR here eliminates the mismatch completely.
const Navbar = dynamic(() => import("./Navbar"), { ssr: false });

export default function LayoutShell({ children }) {
  const pathname = usePathname() || "/";

  const isEditor   = /^\/documents\/[^/]+$/.test(pathname);
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isOAuthPage = pathname.startsWith("/oauth");
  const hideNavbar = isEditor || isAuthPage || isOAuthPage;

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}
