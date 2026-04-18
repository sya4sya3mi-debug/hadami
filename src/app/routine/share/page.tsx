"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RoutineSharePageClient, {
  type StepDraft,
} from "@/components/routine/RoutineSharePageClient";
import {
  defaultRoutineCardConfig,
  type RoutineCardConfig,
} from "@/lib/routines";
import { parseRoutineCardMode } from "@/lib/routineCards";

const DRAFT_KEY = "hadami.shareCard.draft";

type Draft = {
  config: RoutineCardConfig;
  amSteps: StepDraft[];
  pmSteps: StepDraft[];
};

function RoutineSharePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        router.replace("/deck");
        return;
      }
      const parsed = JSON.parse(raw) as Partial<Draft>;
      setDraft({
        config: { ...defaultRoutineCardConfig(), ...(parsed.config ?? {}) },
        amSteps: Array.isArray(parsed.amSteps) ? parsed.amSteps : [],
        pmSteps: Array.isArray(parsed.pmSteps) ? parsed.pmSteps : [],
      });
    } catch {
      router.replace("/deck");
      return;
    } finally {
      setResolved(true);
    }
  }, [router]);

  if (!resolved || !draft) return null;

  const initialCardMode = parseRoutineCardMode(searchParams.get("card"));

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
