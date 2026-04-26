import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import TabBar from "@/components/ui/TabBar";
import PwaRegister from "@/components/PwaRegister";
import IngredientPreloader from "@/components/IngredientPreloader";
import TabShell from "@/components/TabShell";
import { AuthProvider } from "@/lib/auth";


export const metadata: Metadata = {
  title: "HADAMI（ハダミ）- 成分図鑑",
  description: "化粧品の成分表を撮影するだけで成分を解析し、図鑑として集め、スキンケアルーティンを組めるアプリ",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HADAMI",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f0eee9",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3T6JXDLRB7"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-3T6JXDLRB7');
        `}</Script>
        <link rel="preload" href="/fonts/YakuHanJPs/YakuHanJPs-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/YakuHanJPs/YakuHanJPs-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* Prevent flash of wrong theme on load */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function(){
            try {
              var t = localStorage.getItem('hadami-theme');
              if (t === 'dark') document.documentElement.classList.add('dark');
            } catch(e) {}
          })();
        `}</Script>
        <Script id="recovery-redirect" strategy="beforeInteractive">{`
          (function () {
            try {
              var url = new URL(window.location.href);
              if (url.pathname === "/auth/reset-password") return;

              var hashParams = new URLSearchParams(url.hash.slice(1));
              var hasRecoveryParams =
                url.searchParams.get("type") === "recovery" ||
                url.searchParams.get("flow") === "recovery" ||
                !!url.searchParams.get("token_hash") ||
                !!url.searchParams.get("code") ||
                hashParams.get("type") === "recovery" ||
                !!hashParams.get("access_token");

              if (!hasRecoveryParams) return;

              var nextUrl = new URL("/auth/reset-password", window.location.origin);
              nextUrl.searchParams.set("mode", "update");

              ["code", "token_hash", "type", "flow", "recovery_error"].forEach(function (key) {
                var value = url.searchParams.get(key);
                if (value) nextUrl.searchParams.set(key, value);
              });

              var nextHash = hashParams.toString();
              if (nextHash) nextUrl.hash = nextHash;

              window.location.replace(nextUrl.toString());
            } catch (e) {}
          })();
        `}</Script>
      </head>
      <body>
        <AuthProvider>
          <PwaRegister />
          <IngredientPreloader />

          <div id="app-container">
            <main className="pb-[calc(80px+env(safe-area-inset-bottom))]">
              <TabShell>{children}</TabShell>
            </main>
            <TabBar />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
