import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/ui/TabBar";
import PwaRegister from "@/components/PwaRegister";
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
  themeColor: "#3A8F7A",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preload" href="/fonts/YakuHanJPs/YakuHanJPs-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/YakuHanJPs/YakuHanJPs-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <PwaRegister />

          <div id="app-container">
            <main className="pb-[calc(80px+env(safe-area-inset-bottom))]">
              {children}
            </main>
            <TabBar />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
