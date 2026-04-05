"use client";

import Link from "next/link";
import Image from "next/image";

const features = [
  {
    emoji: "📷",
    title: "スキャン",
    description: "コスメをスキャンするだけで、AIが成分を自動で特定。ネットから成分情報を検索します。成分表を手動入力することもできます。",
    color: "#5BBFAD",
    bg: "linear-gradient(135deg, #E8FAF8, #B2E8E0)",
  },
  {
    emoji: "📖",
    title: "成分図鑑",
    description: "見つけた成分をコレクション。各成分の解説や豆知識も学べる。レア度別に集めて図鑑をコンプリートしよう。",
    color: "#F9A8C0",
    bg: "linear-gradient(135deg, #FFF0F5, #F9C8D8)",
  },
  {
    emoji: "🃏",
    title: "マイスキンケアデッキ",
    description: "朝・夜のスキンケアルーティンをデッキで管理。保湿・美白・バリアなど6カテゴリのカバー率をレーダーチャートで可視化。成分の相性チェックやAIおすすめ自動選択で、自分だけのベストな組み合わせを見つけよう。",
    color: "#7C6AEF",
    bg: "linear-gradient(135deg, #F0EEFF, #D8D0FF)",
  },
];

const steps = [
  { number: "1", title: "撮影する", description: "コスメのパッケージを撮影" },
  { number: "2", title: "成分を知る", description: "AIが成分を自動解析" },
  { number: "3", title: "集めて組む", description: "図鑑を埋めてマイスキンケアデッキを組む" },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}
    >
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
            <h1 className="text-2xl font-bold" style={{ color: "#2D2D2D" }}>
              HADAMI
            </h1>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)", color: "#fff" }}
            >
              BETA
            </span>
          </div>
          <p className="text-base font-medium mb-2" style={{ color: "#5BBFAD" }}>
            成分を知って、肌をもっと好きになる。
          </p>
          <p className="text-sm mb-2" style={{ color: "#9B9B9B" }}>
            コスメの成分をスキャンして集める、新感覚スキンケアアプリ
          </p>
          <p className="text-xs" style={{ color: "#C5C5C5" }}>
            Produced by{" "}
            <a
              href="https://blog-engine.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "#F9A8C0" }}
            >
              みおのミハダノート
            </a>
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/auth/login"
          className="block w-full py-3.5 rounded-2xl text-center text-white font-bold text-base mb-2"
          style={{ background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)", boxShadow: "0 4px 16px rgba(91,191,173,0.3)" }}
        >
          無料ではじめる
        </Link>
        <p className="text-center text-xs mb-10" style={{ color: "#9B9B9B" }}>
          無料ベータ版：1アカウント10回までスキャン無料
        </p>

        {/* App purpose */}
        <div
          className="rounded-3xl p-5 mb-10"
          style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(91,191,173,0.15)" }}
        >
          <p className="text-sm font-bold mb-3" style={{ color: "#2D2D2D" }}>
            あなたは、毎日使っているコスメの成分を知っていますか？
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "#6B6B6B" }}>
            スキンケアをがんばっているのに「なぜか肌に合わない」「何が自分に合っているのかわからない」と感じたことはありませんか。
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "#6B6B6B" }}>
            HADAMIは、コスメをスキャンするか成分リストを入力するだけで、各成分の特徴・はたらきをわかりやすく確認できるアプリです。
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>
            まずは手元にあるコスメを1本試してみてください。
            「この成分にこんなはたらきがあったんだ」という小さな気づきが、自分の肌を理解する最初の一歩になります。
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-10">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-4 shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: f.bg }}
                >
                  {f.emoji}
                </div>
                <div>
                  <div className="font-bold text-sm mb-1" style={{ color: f.color }}>
                    {f.title}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>
                    {f.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h2 className="text-center text-sm font-bold mb-4" style={{ color: "#9B9B9B" }}>
            使い方
          </h2>
          <div className="flex justify-between gap-2">
            {steps.map((s) => (
              <div key={s.number} className="flex-1 text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2"
                  style={{ background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)" }}
                >
                  {s.number}
                </div>
                <div className="font-bold text-xs mb-0.5" style={{ color: "#2D2D2D" }}>
                  {s.title}
                </div>
                <div className="text-xs" style={{ color: "#9B9B9B" }}>
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
          className="block w-full py-3 rounded-2xl text-center text-sm font-medium mb-4"
          style={{ background: "#FFF0F5", color: "#F9A8C0", border: "1px solid rgba(249,168,192,0.2)" }}
        >
          みおのミハダノート（ブログ）を読む →
        </a>

        {/* Bottom CTA */}
        <Link
          href="/auth/login"
          className="block w-full py-3.5 rounded-2xl text-center text-white font-bold text-base mb-3"
          style={{ background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)", boxShadow: "0 4px 16px rgba(91,191,173,0.3)" }}
        >
          無料ではじめる
        </Link>
        <p className="text-center text-xs" style={{ color: "#9B9B9B" }}>
          Googleアカウントで簡単登録
        </p>

        {/* フッターリンク */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/privacy" className="text-xs" style={{ color: "#9B9B9B" }}>
            プライバシーポリシー
          </Link>
          <span className="text-xs" style={{ color: "#D5D5D5" }}>|</span>
          <Link href="/terms" className="text-xs" style={{ color: "#9B9B9B" }}>
            利用規約
          </Link>
        </div>
      </div>
    </div>
  );
}
