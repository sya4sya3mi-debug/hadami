import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/ui/TabBar";

export const metadata: Metadata = {
  title: "HADAMI（ハダミ）- 成分図鑑",
  description: "化粧品の成分表を撮影するだけで成分を解析し、図鑑として集め、スキンケアデッキを組めるアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div id="app-container">
          <main style={{ paddingBottom: "72px" }}>
            {children}
          </main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
