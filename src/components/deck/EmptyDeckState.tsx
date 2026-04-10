"use client";

import Link from "next/link";
import Image from "next/image";
import { Product, RoutineType } from "@/types";
import { SunIcon, MoonIcon, SparkleIcon, CameraIcon, PackageIcon } from "@/components/ui/Icons";

interface EmptyDeckStateProps {
  routine: RoutineType;
  allProducts: Product[];
  onCreateRoutine: () => void;
  onAutoRecommend: () => void;
}

export default function EmptyDeckState({
  routine,
  allProducts,
  onCreateRoutine,
  onAutoRecommend,
}: EmptyDeckStateProps) {
  const hasProducts = allProducts.length > 0;

  return (
    <div className="text-center py-16 px-6 animate-fade-up">
      <div
        className="w-24 h-24 rounded-[28px] mx-auto mb-5 flex items-center justify-center
                    bg-gradient-to-br from-bo-accent-soft to-bo-accent-pale
                    shadow-[0_8px_24px_rgba(58,143,122,0.15)]"
      >
        {routine === "morning"
          ? <SunIcon size={40} color="#3A8F7A" />
          : <MoonIcon size={40} color="#3A8F7A" />}
      </div>
      <h2 className="text-lg font-bold text-bo-ink mb-2 font-sans">
        {routine === "morning" ? "朝" : "夜"}のルーティンを始めよう
      </h2>

      {hasProducts ? (
        <>
          <p className="text-sm text-bo-ink-muted leading-relaxed mb-6 font-sans">
            あなたの化粧品から最適なスキンケア
            <br />
            ルーティンを組み立てましょう。
          </p>

          {/* Product preview thumbnails */}
          <div className="flex justify-center gap-2 mb-8">
            {allProducts.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="w-10 h-10 rounded-xl overflow-hidden bg-bo-parchment shrink-0"
              >
                {p.packageImage ? (
                  <Image
                    src={p.packageImageThumb ?? p.packageImage}
                    alt={p.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PackageIcon size={16} color="#9E9E9E" />
                  </div>
                )}
              </div>
            ))}
            {allProducts.length > 5 && (
              <div className="w-10 h-10 rounded-xl bg-bo-parchment flex items-center justify-center text-xs font-bold text-bo-ink-muted">
                +{allProducts.length - 5}
              </div>
            )}
          </div>

          <button
            onClick={onCreateRoutine}
            className="w-full py-4 rounded-r2 border-none bg-bo-accent text-white text-base font-bold
                       font-sans cursor-pointer shadow-bo-accent pressable"
          >
            ＋ ルーティンを作る
          </button>
          <button
            onClick={onAutoRecommend}
            className="w-full mt-3 py-3.5 rounded-r2 bg-white text-bo-accent text-sm font-bold
                       font-sans cursor-pointer border border-bo-accent/20 shadow-bo1 pressable"
          >
            <SparkleIcon size={14} /> AIにおまかせ
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-bo-ink-muted leading-relaxed mb-8 font-sans">
            まずは化粧品をスキャンして
            <br />
            成分を読み取りましょう。
          </p>
          <Link
            href="/scan"
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-r2
                       bg-bo-accent text-white text-base font-bold font-sans no-underline
                       shadow-bo-accent pressable"
          >
            <CameraIcon size={16} color="white" /> スキャンする
          </Link>
        </>
      )}
    </div>
  );
}
