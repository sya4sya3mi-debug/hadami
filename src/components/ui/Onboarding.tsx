"use client";

import { useState } from "react";

const PAGES = [
  {
    icon: "📸",
    bgClass: "bg-gradient-to-br from-[#E8FAF8] to-[#D4F5EF]",
    title: "撮って、知る",
    desc: "コスメのパッケージにカメラを向けるだけ。\nAIが商品を特定し、ネットから\n成分情報を自動で取得します。",
  },
  {
    icon: "📖",
    bgClass: "bg-gradient-to-br from-[#F0E8F5] to-[#E8E0F0]",
    title: "集めて、楽しむ",
    desc: "見つけた成分は図鑑にコレクト。\n★レアリティで珍しさがわかる。\nコンプリートを目指そう。",
  },
  {
    icon: "🃏",
    bgClass: "bg-gradient-to-br from-[#FFF3DC] to-[#FDECC8]",
    title: "組んで、整える",
    desc: "お気に入りの製品でスキンケア\nデッキを組む。カテゴリカバー率や\n相乗効果も確認できます。",
  },
];

export default function Onboarding({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [page, setPage] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-bo-cream">
      <div className="pt-4 px-5 text-right">
        <button
          onClick={onComplete}
          className="text-xs text-bo-ink-muted bg-transparent border-none cursor-pointer font-sans"
        >
          スキップ
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
        <div key={page} className="animate-fade-up">
          <div
            className={`w-[120px] h-[120px] rounded-[36px] mx-auto mb-8 flex items-center justify-center text-5xl shadow-[0_12px_40px_rgba(58,143,122,0.1)] ${PAGES[page].bgClass}`}
          >
            {PAGES[page].icon}
          </div>
          <h2 className="text-[26px] font-extrabold font-serif text-bo-ink m-0 mb-4 tracking-tight">
            {PAGES[page].title}
          </h2>
          <p className="text-sm text-bo-ink-muted font-sans leading-8 m-0 whitespace-pre-line">
            {PAGES[page].desc}
          </p>
        </div>
      </div>

      <div className="px-6 pb-12">
        <div className="flex justify-center gap-2 mb-6">
          {PAGES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded transition-all duration-300 ${
                i === page
                  ? "w-6 bg-bo-accent"
                  : "w-2 bg-bo-parchment"
              }`}
            />
          ))}
        </div>

        {page < PAGES.length - 1 ? (
          <button
            onClick={() => setPage(page + 1)}
            className="w-full py-4 rounded-r1 border-none bg-bo-accent text-white text-[15px] font-bold font-sans cursor-pointer shadow-bo-accent"
          >
            次へ
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="w-full py-4 rounded-r1 border-none bg-gradient-to-br from-bo-accent to-[#5BBFAD] text-white text-[15px] font-bold font-sans cursor-pointer shadow-[0_4px_20px_rgba(58,143,122,0.25)]"
          >
            最初のコスメをスキャンしよう 📸
          </button>
        )}
      </div>
    </div>
  );
}
