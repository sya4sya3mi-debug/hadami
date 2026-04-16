import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Step = {
  icon: string;
  step_name: string;
  product_name: string | null;
  time_of_day: string;
  step_order: number;
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: routine, error } = await supabase
      .from("routines")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !routine) return fallbackImage();

    const { data: steps } = await supabase
      .from("routine_steps")
      .select("icon, step_name, product_name, time_of_day, step_order")
      .eq("routine_id", params.id)
      .order("step_order", { ascending: true });

    const allSteps = (steps ?? []) as Step[];
    const amSteps = allSteps.filter((s) => s.time_of_day === "am").slice(0, 5);
    const pmSteps = allSteps.filter((s) => s.time_of_day === "pm").slice(0, 5);
    const concerns = (routine.concerns as string[]) ?? [];
    const skinType = routine.skin_type ?? "乾燥肌";

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            background: "linear-gradient(135deg, #f0faf7, #e8f5f1)",
            padding: 60,
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: 3,
                  color: "#3A8F7A",
                  marginBottom: 8,
                }}
              >
                HADAMI
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#1a2e28",
                  lineHeight: 1.3,
                  marginBottom: 12,
                }}
              >
                {routine.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#3A8F7A15",
                    color: "#3A8F7A",
                    fontSize: 18,
                    fontWeight: 600,
                    padding: "4px 16px",
                    borderRadius: 24,
                  }}
                >
                  {skinType}
                </div>
                {concerns.slice(0, 5).map((c: string) => (
                  <div
                    key={c}
                    style={{
                      fontSize: 14,
                      padding: "3px 12px",
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.08)",
                      color: "#5a7a70",
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div style={{ display: "flex", gap: 32, flex: 1 }}>
              <StepCol label="☀️ Morning" steps={amSteps} />
              <StepCol label="🌙 Night" steps={pmSteps} />
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 14,
                color: "#5a7a70",
                opacity: 0.6,
                marginTop: 16,
              }}
            >
              <span>hadami.vercel.app</span>
              <span style={{ fontWeight: 700, color: "#3A8F7A" }}>HADAMI</span>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch {
    return fallbackImage();
  }
}

function StepCol({ label, steps }: { label: string; steps: Step[] }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#3A8F7A",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.length === 0 ? (
          <div style={{ fontSize: 16, color: "#5a7a70", opacity: 0.5 }}>未設定</div>
        ) : (
          steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(255,255,255,0.85)",
                borderRadius: 14,
                padding: "10px 16px",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1a2e28" }}>
                  {s.step_name}
                </span>
                {s.product_name && (
                  <span style={{ fontSize: 12, color: "#5a7a70" }}>{s.product_name}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function fallbackImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0faf7, #e8f5f1)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#3A8F7A",
              letterSpacing: 4,
            }}
          >
            HADAMI
          </div>
          <div style={{ fontSize: 20, color: "#5a7a70", marginTop: 8 }}>
            スキンケアルーティンシェア
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
