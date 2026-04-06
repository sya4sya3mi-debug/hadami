"use client";

import Link from "next/link";
import Image from "next/image";
import { getAccountScanLimit } from "@/lib/db";
import { StarIcon } from "@/components/ui/Badge";

const features = [
  {
    emoji: "📷",
    title: "スキャン",
    description: "コスメをスキャンするだけで、AIが成分を自動で特定。ネットから成分情報を検索します。成分表を手動入力することもできます。",
    color: "#3A8F7A",
    bg: "linear-gradient(135deg, #E8F5F1, #C5E8D8)",
  },
  {
    emoji: "📖",
    title: "成分図鑑",
    description: "見つけた成分をコレクション。各成分の解説や豆知識も学べる。レア度別に集めて図鑑をコンプリートしよう。",
    color: "#5A7A4A",
    bg: "linear-gradient(135deg, #E8EFE3, #D8E6CF)",
  },
  {
    emoji: "⭐",
    title: "マイスキンケアデッキ",
    description: "朝・夜のスキンケアルーティンをデッキで管理。保湿・美白・バリアなど6カテゴリのカバー率をレーダーチャートで可視化。成分の相性チェックやAIおすすめ自動選択で、自分だけのベストな組み合わせを見つけよう。",
    color: "#6B4A8A",
    bg: "linear-gradient(135deg, #EDE3F0, #D5C8E2)",
  },
];

const steps = [
  { number: "1", title: "撮影する", description: "コスメのパッケージを撮影" },
  { number: "2", title: "成分を知る", description: "AIが成分を自動解析" },
  { number: "3", title: "集めて組む", description: "図鑑を埋めてマイスキンケアデッキを組む" },
];

export default function LandingPage() {
  const scanLimit = getAccountScanLimit();

  return (
    <div className="min-h-screen bg-bo-cream">
      <div className="px-5 pt-12 pb-16 max-w-md mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <Image
              src="/hadami-logo.png"
              alt="HADAMI"
              width={96}
              height={96}
              className="rounded-2xl shadow-md"
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-bo-ink">
              HADAMI
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bo-accent text-white">
              BETA
            </span>
          </div>
          <p className="text-base font-medium mb-2 text-bo-accent">
            成分を知って、肌をもっと好きになる。
          </p>
          <p className="text-sm mb-2 text-bo-ink-muted">
            コスメの成分をスキャンして集める、新感覚スキンケアアプリ
          </p>
          <p className="text-xs text-bo-ink-faint">
            Produced by{" "}
            <a
              href="https://blog-engine.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-bo-accent"
            >
              みおのミハダノート
            </a>
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/auth/login"
          className="block w-full py-3.5 rounded-r2 text-center text-white font-bold text-base mb-2 bg-bo-accent shadow-bo-accent"
        >
          無料ではじめる
        </Link>
        <p className="text-center text-xs mb-10 text-bo-ink-muted">
          無料ベータ版：1アカウント{scanLimit}回までスキャン無料
        </p>

        {/* App purpose */}
        <div className="rounded-r3 p-5 mb-10 bg-white/70 border border-bo-accent/[0.12]">
          <p className="text-sm font-bold mb-3 text-bo-ink">
            あなたは、毎日使っているコスメの成分を知っていますか？
          </p>
          <p className="text-xs leading-relaxed mb-3 text-bo-ink-soft">
            スキンケアをがんばっているのに「なぜか肌に合わない」「何が自分に合っているのかわからない」と感じたことはありませんか。
          </p>
          <p className="text-xs leading-relaxed mb-3 text-bo-ink-soft">
            HADAMIは、コスメをスキャンするか成分リストを入力するだけで、各成分の特徴・はたらきをわかりやすく確認できるアプリです。
          </p>
          <p className="text-xs leading-relaxed text-bo-ink-soft">
            まずは手元にあるコスメを1本試してみてください。
            「この成分にこんなはたらきがあったんだ」という小さな気づきが、自分の肌を理解する最初の一歩になります。
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-10">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-r2 p-4 shadow-bo1 border border-bo-parchment"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: f.bg }}
                >
                  {f.emoji === "⭐" ? <StarIcon color={f.color} size={26} /> : f.emoji}
                </div>
                <div>
                  <div className="font-bold text-sm mb-1" style={{ color: f.color }}>
                    {f.title}
                  </div>
                  <p className="text-xs leading-relaxed text-bo-ink-soft">
                    {f.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h2 className="text-center text-sm font-bold mb-4 text-bo-ink-muted">
            使い方
          </h2>
          <div className="flex justify-between gap-2">
            {steps.map((s) => (
              <div key={s.number} className="flex-1 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2 bg-bo-accent">
                  {s.number}
                </div>
                <div className="font-bold text-xs mb-0.5 text-bo-ink">
                  {s.title}
                </div>
                <div className="text-xs text-bo-ink-muted">
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blog link */}
        <a
          href="https://blog-engine.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded-r2 text-center text-sm font-medium mb-4 bg-bo-accent-soft text-bo-accent border border-bo-accent/[0.15]"
        >
          みおのミハダノート（ブログ）を読む →
        </a>

        {/* Bottom CTA */}
        <Link
          href="/auth/login"
          className="block w-full py-3.5 rounded-r2 text-center text-white font-bold text-base mb-3 bg-bo-accent shadow-bo-accent"
        >
          無料ではじめる
        </Link>
        <p className="text-center text-xs text-bo-ink-muted">
          Googleアカウントで簡単登録
        </p>

        {/* フッターリンク */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/privacy" className="text-xs text-bo-ink-muted">
            プライバシーポリシー
          </Link>
          <span className="text-xs text-bo-ink-faint">|</span>
          <Link href="/terms" className="text-xs text-bo-ink-muted">
            利用規約
          </Link>
        </div>
      </div>
    </div>
  );
}
