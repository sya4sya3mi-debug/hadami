import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import RoutineSharePageClient from "@/components/routine/RoutineSharePageClient";
import type { Routine } from "@/lib/routines";

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
    .select("*, product:products(id, name, brand, image_url)")
    .eq("routine_id", id)
    .order("time_of_day", { ascending: true })
    .order("step_order", { ascending: true });

  return { ...routine, steps: steps ?? [] } as Routine;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const routine = await getRoutine(params.id);
  if (!routine) return { title: "HADAMI" };

  const concerns = routine.concerns.join("・") || "スキンケア";
  const amCount = routine.steps.filter((s) => s.time_of_day === "am").length;
  const pmCount = routine.steps.filter((s) => s.time_of_day === "pm").length;
  const ogImageUrl = `${APP_URL}/api/og/routine/${params.id}`;

  return {
    title: `${routine.name} | HADAMI`,
    description: `${routine.skin_type} / ${concerns} · AM ${amCount}ステップ / PM ${pmCount}ステップ`,
    openGraph: {
      title: routine.name,
      description: `${routine.skin_type} / ${concerns} · AM ${amCount}ステップ / PM ${pmCount}ステップ`,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: routine.name,
      description: `${routine.skin_type} / ${concerns} · AM ${amCount}ステップ / PM ${pmCount}ステップ`,
      images: [ogImageUrl],
    },
  };
}

export default async function RoutineSharePage({
  params,
}: {
  params: { id: string };
}) {
  const routine = await getRoutine(params.id);
  if (!routine) notFound();

  return <RoutineSharePageClient routine={routine} />;
}
