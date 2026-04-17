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
    // Empty body is fine.
  }

  const { data, error } = await supabase
    .from("routines")
    .insert({
      user_id: user.id,
      name: "私のスキンケアルーティン",
      skin_type: "普通肌",
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
  const stepRows = [
    ...amSteps.map((step, index) => ({
      routine_id: routineId,
      time_of_day: "am" as const,
      step_order: index + 1,
      step_name: step.step_name,
      product_name: step.product_name ?? null,
      product_id: step.product_id ?? null,
      icon: step.icon ?? "🧴",
    })),
    ...pmSteps.map((step, index) => ({
      routine_id: routineId,
      time_of_day: "pm" as const,
      step_order: index + 1,
      step_name: step.step_name,
      product_name: step.product_name ?? null,
      product_id: step.product_id ?? null,
      icon: step.icon ?? "🧴",
    })),
  ];

  if (stepRows.length > 0) {
    const { error: stepsError } = await supabase.from("routine_steps").insert(stepRows);

    if (stepsError) {
      await supabase.from("routines").delete().eq("id", routineId).eq("user_id", user.id);
      return NextResponse.json(
        { error: stepsError.message ?? "ルーティンステップの保存に失敗しました" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ routineId });
}
