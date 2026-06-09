import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export const metadata = {
  title: "CollabDoc — Real-Time Collaborative Document Editor",
  description:
    "Create, edit, and collaborate on documents with your team. Real-time syncing, version history, comments, and more.",
  keywords: ["collaborative editor", "real-time", "documents", "CollabDoc"],
  authors: [{ name: "CollabDoc" }],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7C3AED",
};

// Prevent FOUC — applies dark class before first paint
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('collab_theme');
    if (t !== 'light') document.documentElement.classList.add('dark');
  } catch (e) { document.documentElement.classList.add('dark'); }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
