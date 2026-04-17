"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import RoutineShareCard from "./RoutineShareCard";
import { saveRoutineAction, deleteRoutineAction } from "@/app/actions/routineActions";
import {
  routineToCardConfig,
  getAmSteps,
  getPmSteps,
  type Routine,
  type RoutineCardConfig,
} from "@/lib/routines";

const SKIN_TYPES = ["乾燥肌", "脂性肌", "混合肌", "敏感肌", "普通肌"];
const CONCERN_OPTIONS = [
  "毛穴", "ニキビ", "シミ", "くすみ", "シワ", "たるみ",
  "乾燥", "テカリ", "赤み", "肌荒れ", "美白", "エイジング",
];
const ACCENT_COLORS = [
  { label: "グリーン", value: "#3A8F7A" },
  { label: "テラコッタ", value: "#C47D5E" },
  { label: "モーブ", value: "#8B7BA8" },
  { label: "ネイビー", value: "#4A6FA5" },
  { label: "ゴールド", value: "#B8962A" },
];
const STEP_ICONS = ["🌿", "💧", "✨", "🧴", "🌸", "🫧", "☁️", "🍃", "💎", "🌊"];

type StepDraft = { icon: string; step_name: string; product_name: string };

export default function RoutineSharePageClient({ routine }: { routine: Routine }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Config state
  const [config, setConfig] = useState<RoutineCardConfig>(() => routineToCardConfig(routine));
  const [amSteps, setAmSteps] = useState<StepDraft[]>(() =>
    getAmSteps(routine).map((s) => ({
      icon: s.icon,
      step_name: s.step_name,
      product_name: s.product_name ?? "",
    }))
  );
  const [pmSteps, setPmSteps] = useState<StepDraft[]>(() =>
    getPmSteps(routine).map((s) => ({
      icon: s.icon,
      step_name: s.step_name,
      product_name: s.product_name ?? "",
    }))
  );
  const [activeTab, setActiveTab] = useState<"am" | "pm">("am");

  const currentSteps = activeTab === "am" ? amSteps : pmSteps;
  const setCurrentSteps = activeTab === "am" ? setAmSteps : setPmSteps;

  const updateConfig = useCallback(
    (patch: Partial<RoutineCardConfig>) => setConfig((c) => ({ ...c, ...patch })),
    []
  );

  const addStep = () => {
    setCurrentSteps((prev) => [...prev, { icon: "🌿", step_name: "", product_name: "" }]);
  };

  const removeStep = (i: number) => {
    setCurrentSteps((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateStep = (i: number, patch: Partial<StepDraft>) => {
    setCurrentSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const handleSave = () => {
    startTransition(async () => {
      await saveRoutineAction(
        routine.id,
        {
          name: config.title,
          skin_type: config.skinType,
          concerns: config.concerns,
          note: config.note,
          is_public: true,
        },
        amSteps.filter((s) => s.step_name.trim()).map((s) => ({
          step_name: s.step_name,
          product_name: s.product_name || undefined,
          icon: s.icon,
        })),
        pmSteps.filter((s) => s.step_name.trim()).map((s) => ({
          step_name: s.step_name,
          product_name: s.product_name || undefined,
          icon: s.icon,
        }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleDelete = () => {
    if (!confirm("このルーティンを削除しますか？")) return;
    startTransition(() => deleteRoutineAction(routine.id));
  };

  const copyShareText = () => {
    const amCount = amSteps.filter((s) => s.step_name.trim()).length;
    const pmCount = pmSteps.filter((s) => s.step_name.trim()).length;
    const url = `${window.location.origin}/routine/${routine.id}/share`;
    const text = [
      `🌿 ${config.title}`,
      `${config.skinType} / ${config.concerns.join("・") || "お肌の悩みなし"}`,
      `☀️ AM ${amCount}ステップ / 🌙 PM ${pmCount}ステップ`,
      "",
      config.note ? `💬 ${config.note}\n` : "",
      url,
      "#HADAMI #スキンケア",
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const toggleConcern = (c: string) => {
    updateConfig({
      concerns: config.concerns.includes(c)
        ? config.concerns.filter((x) => x !== c)
        : [...config.concerns, c],
    });
  };

  return (
    <div className="min-h-screen px-4 pt-4 pb-8 max-w-5xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/routine")}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <span className="text-lg leading-none">‹</span>
          <span>マイルーティン</span>
        </button>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-semibold truncate">{config.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Editor */}
        <div className="flex-1 space-y-6 order-2 lg:order-1">
          {/* Title */}
          <Section title="タイトル">
            <input
              type="text"
              value={config.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8F7A]/30"
              placeholder="ルーティン名"
            />
          </Section>

          {/* Username */}
          <Section title="Xアカウント名（任意）">
            <input
              type="text"
              value={config.username}
              onChange={(e) => updateConfig({ username: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8F7A]/30"
              placeholder="@username"
            />
          </Section>

          {/* Skin Type */}
          <Section title="肌タイプ">
            <div className="flex flex-wrap gap-2">
              {SKIN_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => updateConfig({ skinType: t })}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    config.skinType === t
                      ? "text-white"
                      : "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                  }`}
                  style={config.skinType === t ? { backgroundColor: config.accentColor } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          </Section>

          {/* Concerns */}
          <Section title="お肌の悩み">
            <div className="flex flex-wrap gap-2">
              {CONCERN_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleConcern(c)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    config.concerns.includes(c)
                      ? "text-white"
                      : "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                  }`}
                  style={config.concerns.includes(c) ? { backgroundColor: config.accentColor } : {}}
                >
                  {c}
                </button>
              ))}
            </div>
          </Section>

          {/* Note */}
          <Section title="ひとことメモ">
            <textarea
              value={config.note}
              onChange={(e) => updateConfig({ note: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A8F7A]/30 resize-none"
              rows={2}
              placeholder="スキンケアのこだわりポイントなど..."
            />
          </Section>

          {/* Theme */}
          <Section title="テーマ">
            <div className="flex gap-2">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateConfig({ theme: t })}
                  className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
                    config.theme === t
                      ? "text-white"
                      : "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                  }`}
                  style={config.theme === t ? { backgroundColor: config.accentColor } : {}}
                >
                  {t === "light" ? "ライト" : "ダーク"}
                </button>
              ))}
            </div>
          </Section>

          {/* Accent Color */}
          <Section title="アクセントカラー">
            <div className="flex gap-3">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => updateConfig({ accentColor: c.value })}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="w-8 h-8 rounded-full transition-transform"
                    style={{
                      backgroundColor: c.value,
                      transform: config.accentColor === c.value ? "scale(1.2)" : "scale(1)",
                      boxShadow:
                        config.accentColor === c.value ? `0 0 0 3px ${c.value}40` : "none",
                    }}
                  />
                  <span className="text-[10px] text-gray-500">{c.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Steps Editor */}
          <Section title="ステップ編集">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("am")}
                className={`flex-1 text-center py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "am" ? "text-white" : "bg-black/5 dark:bg-white/10"
                }`}
                style={activeTab === "am" ? { backgroundColor: config.accentColor } : {}}
              >
                ☀️ Morning
              </button>
              <button
                onClick={() => setActiveTab("pm")}
                className={`flex-1 text-center py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "pm" ? "text-white" : "bg-black/5 dark:bg-white/10"
                }`}
                style={activeTab === "pm" ? { backgroundColor: config.accentColor } : {}}
              >
                🌙 Night
              </button>
            </div>

            <div className="space-y-3">
              {currentSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5"
                >
                  {/* Icon picker */}
                  <select
                    value={step.icon}
                    onChange={(e) => updateStep(i, { icon: e.target.value })}
                    className="text-lg bg-transparent cursor-pointer"
                  >
                    {STEP_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={step.step_name}
                      onChange={(e) => updateStep(i, { step_name: e.target.value })}
                      className="w-full text-sm px-2 py-1 rounded-lg border border-black/5 dark:border-white/10 bg-transparent focus:outline-none focus:ring-1 focus:ring-[#3A8F7A]/30"
                      placeholder="ステップ名（例：化粧水）"
                    />
                    <input
                      type="text"
                      value={step.product_name}
                      onChange={(e) => updateStep(i, { product_name: e.target.value })}
                      className="w-full text-xs px-2 py-1 rounded-lg border border-black/5 dark:border-white/10 bg-transparent focus:outline-none focus:ring-1 focus:ring-[#3A8F7A]/30 text-gray-500"
                      placeholder="商品名（任意）"
                    />
                  </div>
                  <button
                    onClick={() => removeStep(i)}
                    className="text-red-400 hover:text-red-500 text-sm mt-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addStep}
              className="mt-3 w-full py-2 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              ＋ ステップを追加
            </button>
          </Section>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: config.accentColor }}
            >
              {saved ? "✓ 保存しました" : isPending ? "保存中..." : "保存する"}
            </button>
            <button
              onClick={copyShareText}
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-black/10 dark:border-white/10 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              📋 投稿テキストをコピー
            </button>
          </div>

          <button
            onClick={handleDelete}
            className="w-full text-center text-xs text-red-400 hover:text-red-500 py-2"
          >
            このルーティンを削除
          </button>
        </div>

        {/* Right: Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start order-1 lg:order-2">
          <div className="text-xs text-gray-400 mb-2 text-center lg:text-left">プレビュー</div>
          <div className="flex justify-center">
            <RoutineShareCard
              config={config}
              amSteps={amSteps.filter((s) => s.step_name.trim())}
              pmSteps={pmSteps.filter((s) => s.step_name.trim())}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
        {title}
      </label>
      {children}
    </div>
  );
}
