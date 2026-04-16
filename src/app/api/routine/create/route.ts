import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";

type StepInput = {
  step_name: string;
  product_name?: string;
  product_id?: string;
  icon?: string;
};

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { supabase, user } = auth;

  let body: { amSteps?: StepInput[]; pmSteps?: StepInput[] } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — create with no steps
  }

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

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "ルーティンの作成に失敗しました" },
      { status: 500 }
    );
  }

  const routineId = data.id;
  const amSteps = body.amSteps ?? [];
  const pmSteps = body.pmSteps ?? [];

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

  return NextResponse.json({ routineId });
}
