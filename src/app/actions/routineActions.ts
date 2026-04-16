"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return (cookieStore as Awaited<typeof cookieStore>).getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            (cookieStore as Awaited<typeof cookieStore>).set(name, value, options)
          );
        },
      },
    }
  );
}

async function getUser() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createRoutineAction(
  prefill?: {
    amSteps?: { step_name: string; product_name?: string; product_id?: string; icon?: string }[];
    pmSteps?: { step_name: string; product_name?: string; product_id?: string; icon?: string }[];
  }
) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("routines")
    .insert({
      user_id: user.id,
      name: "私のスキンケアルーティン",
      skin_type: "乾燥肌",
      concerns: [],
    })
    .select("id")
    .single();

  if (error || !data) redirect("/routine");

  // デッキからのprefillステップを挿入
  const routineId = data.id;
  const amSteps = prefill?.amSteps ?? [];
  const pmSteps = prefill?.pmSteps ?? [];

  if (amSteps.length > 0) {
    await supabase.from("routine_steps").insert(
      amSteps.map((s, i) => ({
        routine_id: routineId,
        time_of_day: "am" as const,
        step_order: i + 1,
        step_name: s.step_name,
        product_name: s.product_name ?? null,
        product_id: s.product_id ?? null,
        icon: s.icon ?? "🌿",
      }))
    );
  }

  if (pmSteps.length > 0) {
    await supabase.from("routine_steps").insert(
      pmSteps.map((s, i) => ({
        routine_id: routineId,
        time_of_day: "pm" as const,
        step_order: i + 1,
        step_name: s.step_name,
        product_name: s.product_name ?? null,
        product_id: s.product_id ?? null,
        icon: s.icon ?? "🌿",
      }))
    );
  }

  redirect(`/routine/${routineId}/share`);
}

export async function saveRoutineAction(
  routineId: string,
  meta: { name: string; skin_type: string; concerns: string[]; note: string; is_public: boolean },
  amSteps: { step_name: string; product_name?: string; product_id?: string; icon?: string }[],
  pmSteps: { step_name: string; product_name?: string; product_id?: string; icon?: string }[]
) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "認証が必要です" };

  // メタ情報更新
  const { error: metaErr } = await supabase
    .from("routines")
    .update({
      name: meta.name,
      skin_type: meta.skin_type,
      concerns: meta.concerns,
      note: meta.note || null,
      is_public: meta.is_public,
    })
    .eq("id", routineId)
    .eq("user_id", user.id);

  if (metaErr) return { error: metaErr.message };

  // AM ステップ一括保存
  await supabase
    .from("routine_steps")
    .delete()
    .eq("routine_id", routineId)
    .eq("time_of_day", "am");

  if (amSteps.length > 0) {
    await supabase.from("routine_steps").insert(
      amSteps.map((s, i) => ({
        routine_id: routineId,
        time_of_day: "am" as const,
        step_order: i + 1,
        step_name: s.step_name,
        product_name: s.product_name ?? null,
        product_id: s.product_id ?? null,
        icon: s.icon ?? "🌿",
      }))
    );
  }

  // PM ステップ一括保存
  await supabase
    .from("routine_steps")
    .delete()
    .eq("routine_id", routineId)
    .eq("time_of_day", "pm");

  if (pmSteps.length > 0) {
    await supabase.from("routine_steps").insert(
      pmSteps.map((s, i) => ({
        routine_id: routineId,
        time_of_day: "pm" as const,
        step_order: i + 1,
        step_name: s.step_name,
        product_name: s.product_name ?? null,
        product_id: s.product_id ?? null,
        icon: s.icon ?? "🌿",
      }))
    );
  }

  revalidatePath(`/routine`);
  revalidatePath(`/routine/${routineId}/share`);
  return { error: null };
}

export async function deleteRoutineAction(routineId: string) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/auth/login");

  await supabase.from("routines").delete().eq("id", routineId).eq("user_id", user.id);
  redirect("/routine");
}
