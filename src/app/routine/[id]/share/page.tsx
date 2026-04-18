import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import {
  getRoutineCardEmoji,
  getRoutineCardLabel,
  parseRoutineCardMode,
} from "@/lib/routineCards";
import RoutineSharePageClient from "@/components/routine/RoutineSharePageClient";
import type { Routine } from "@/lib/routines";
import { attachFallbackProducts } from "@/lib/routineStepProducts";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hadami.vercel.app";

async function getRoutine(id: string): Promise<Routine | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: routine, error } = await supabase
    .from("routines")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !routine) return null;

  const { data: steps } = await supabase
    .from("routine_steps")
    .select("*, product:products(id, name, brand, package_image_url)")
    .eq("routine_id", id)
    .order("time_of_day", { ascending: true })
    .order("step_order", { ascending: true });

  const hydratedSteps = await attachFallbackProducts(
    supabase,
    routine.user_id,
    (steps ?? []) as Routine["steps"]
  );

  return { ...routine, steps: hydratedSteps } as Routine;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { card?: string | string[] };
}): Promise<Metadata> {
  const routine = await getRoutine(params.id);
  if (!routine) return { title: "HADAMI" };

  const cardMode = parseRoutineCardMode(searchParams?.card);
  const cardLabel = getRoutineCardLabel(cardMode);
  const cardEmoji = getRoutineCardEmoji(cardMode);
  const concerns = routine.concerns.join("・") || "スキンケア";
  const stepCount = routine.steps.filter((step) => step.time_of_day === cardMode).length;
  const ogImageUrl = `${APP_URL}/api/og/routine/${params.id}?card=${cardMode}`;
  const description = `${routine.skin_type} / ${concerns} · ${cardEmoji} ${cardLabel} ${stepCount}ステップ`;

  return {
    title: `${routine.name} ${cardLabel}カード | HADAMI`,
    description,
    openGraph: {
      title: `${routine.name} ${cardLabel}カード`,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${routine.name} ${cardLabel}カード`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function RoutineSharePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { card?: string | string[] };
}) {
  const routine = await getRoutine(params.id);
  if (!routine) notFound();

  return (
    <RoutineSharePageClient
      routine={routine}
      initialCardMode={parseRoutineCardMode(searchParams?.card)}
    />
  );
}
