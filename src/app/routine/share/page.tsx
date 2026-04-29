"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RoutineSharePageClient, {
  type StepDraft,
} from "@/components/routine/RoutineSharePageClient";
import {
  coerceRoutineCardConfig,
  type RoutineCardConfig,
} from "@/lib/routines";
import { parseRoutineCardMode } from "@/lib/routineCards";
import {
  coerceAccentColor,
  coerceRoutineTemplate,
  getInitialAccentForMode,
  type AccentColorKey,
  type RoutineTemplateKey,
} from "@/lib/routineCardStyle";

const DRAFT_KEY = "hadami.shareCard.draft";
const STYLE_STORAGE_KEY = "hadami.routineCard.style";

type Draft = {
  config: RoutineCardConfig;
  amSteps: StepDraft[];
  pmSteps: StepDraft[];
};

type SavedStyle = {
  template: RoutineTemplateKey;
  accentColor: AccentColorKey;
} | null;

function readSavedStyle(): SavedStyle {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STYLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      template: coerceRoutineTemplate(parsed.template),
      accentColor: coerceAccentColor(parsed.accentColor),
    };
  } catch {
    return null;
  }
}

function RoutineSharePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [resolved, setResolved] = useState(false);

  const initialCardMode = parseRoutineCardMode(searchParams.get("card"));

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        router.replace("/deck");
        return;
      }
      const parsed = JSON.parse(raw) as Partial<Draft>;
      const baseConfig = coerceRoutineCardConfig(parsed.config);

      // localStorage に保存されたスタイル設定があれば、それで上書き（ユーザーの明示的な選択）
      // 無ければ、URL の ?card=am|pm を見て初回プリセットを適用（朝=terra / 夜=lavender）
      const savedStyle = readSavedStyle();
      const finalConfig: RoutineCardConfig = savedStyle
        ? {
            ...baseConfig,
            template: savedStyle.template,
            accentColor: savedStyle.accentColor,
          }
        : {
            ...baseConfig,
            accentColor: getInitialAccentForMode(initialCardMode),
          };

      setDraft({
        config: finalConfig,
        amSteps: Array.isArray(parsed.amSteps) ? parsed.amSteps : [],
        pmSteps: Array.isArray(parsed.pmSteps) ? parsed.pmSteps : [],
      });
    } catch {
      router.replace("/deck");
      return;
    } finally {
      setResolved(true);
    }
    // initialCardMode は URL から導出され、ページ再マウント時のみ変わる扱い
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!resolved || !draft) return null;

  return (
    <RoutineSharePageClient
      initialConfig={draft.config}
      initialAmSteps={draft.amSteps}
      initialPmSteps={draft.pmSteps}
      initialCardMode={initialCardMode}
    />
  );
}

export default function RoutineSharePage() {
  return (
    <Suspense fallback={null}>
      <RoutineSharePageInner />
    </Suspense>
  );
}
