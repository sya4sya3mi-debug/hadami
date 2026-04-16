import { createClient } from "@/lib/supabase";

// ── Types ──

export type RoutineStep = {
  id: string;
  routine_id: string;
  time_of_day: "am" | "pm";
  step_order: number;
  step_name: string;
  product_name: string | null;
  product_id: string | null;
  icon: string;
  product?: {
    id: string;
    name: string;
    brand: string | null;
    image_url: string | null;
  } | null;
};

export type Routine = {
  id: string;
  user_id: string;
  name: string;
  skin_type: string;
  concerns: string[];
  note: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  steps: RoutineStep[];
};

export type RoutineCardConfig = {
  title: string;
  skinType: string;
  concerns: string[];
  note: string;
  username: string;
  theme: "light" | "dark";
  accentColor: string;
};

// ── Helpers ──

export function getAmSteps(routine: Routine): RoutineStep[] {
  return routine.steps
    .filter((s) => s.time_of_day === "am")
    .sort((a, b) => a.step_order - b.step_order);
}

export function getPmSteps(routine: Routine): RoutineStep[] {
  return routine.steps
    .filter((s) => s.time_of_day === "pm")
    .sort((a, b) => a.step_order - b.step_order);
}

export function routineToCardConfig(routine: Routine): RoutineCardConfig {
  return {
    title: routine.name,
    skinType: routine.skin_type,
    concerns: routine.concerns,
    note: routine.note ?? "",
    username: "",
    theme: "light",
    accentColor: "#3A8F7A",
  };
}

// ── Data Functions ──

export async function getUserRoutines(): Promise<Routine[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: routines, error } = await supabase
    .from("routines")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error || !routines) return [];

  const routineIds = routines.map((r) => r.id);
  if (routineIds.length === 0) return routines.map((r) => ({ ...r, steps: [] }));

  const { data: steps } = await supabase
    .from("routine_steps")
    .select("*, product:products(id, name, brand, image_url)")
    .in("routine_id", routineIds)
    .order("time_of_day", { ascending: true })
    .order("step_order", { ascending: true });

  const stepsByRoutine = new Map<string, RoutineStep[]>();
  (steps ?? []).forEach((s) => {
    const arr = stepsByRoutine.get(s.routine_id) ?? [];
    arr.push(s as RoutineStep);
    stepsByRoutine.set(s.routine_id, arr);
  });

  return routines.map((r) => ({
    ...r,
    steps: stepsByRoutine.get(r.id) ?? [],
  }));
}

export async function getRoutineById(id: string): Promise<Routine | null> {
  const supabase = createClient();

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

  return { ...routine, steps: (steps ?? []) as RoutineStep[] };
}

export async function createRoutine(params: {
  name?: string;
  skin_type?: string;
  concerns?: string[];
  note?: string;
}): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("routines")
    .insert({
      user_id: user.id,
      name: params.name ?? "私のスキンケアルーティン",
      skin_type: params.skin_type ?? "乾燥肌",
      concerns: params.concerns ?? [],
      note: params.note ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function updateRoutine(
  id: string,
  params: {
    name?: string;
    skin_type?: string;
    concerns?: string[];
    note?: string;
    is_public?: boolean;
  }
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("routines").update(params).eq("id", id);
  return !error;
}

export async function upsertRoutineSteps(
  routineId: string,
  timeOfDay: "am" | "pm",
  steps: { step_name: string; product_name?: string; product_id?: string; icon?: string }[]
): Promise<boolean> {
  const supabase = createClient();

  // 既存削除
  await supabase
    .from("routine_steps")
    .delete()
    .eq("routine_id", routineId)
    .eq("time_of_day", timeOfDay);

  if (steps.length === 0) return true;

  // 再挿入
  const rows = steps.map((s, i) => ({
    routine_id: routineId,
    time_of_day: timeOfDay,
    step_order: i + 1,
    step_name: s.step_name,
    product_name: s.product_name ?? null,
    product_id: s.product_id ?? null,
    icon: s.icon ?? "🌿",
  }));

  const { error } = await supabase.from("routine_steps").insert(rows);
  return !error;
}

export async function deleteRoutine(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("routines").delete().eq("id", id);
  return !error;
}
