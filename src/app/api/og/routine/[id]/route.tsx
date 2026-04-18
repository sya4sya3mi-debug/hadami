import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { r2GetSignedUrls } from "@/lib/r2";
import { getProductImageThumbPathFromStoredPath } from "@/lib/productImages";
import {
  getRoutineCardEmoji,
  getRoutineCardHeading,
  getRoutineCardLabel,
  parseRoutineCardMode,
} from "@/lib/routineCards";
import { attachFallbackProducts } from "@/lib/routineStepProducts";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Step = {
  icon: string;
  step_name: string;
  product_name: string | null;
  brand: string | null;
  package_image_url: string | null;
  time_of_day: string;
  step_order: number;
};

function isDirectImageUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  );
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const cardMode = parseRoutineCardMode(new URL(request.url).searchParams.get("card"));
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: routine, error } = await supabase
      .from("routines")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !routine) return fallbackImage();

    const { data: steps } = await supabase
      .from("routine_steps")
      .select("icon, step_name, product_name, time_of_day, step_order, product:products(brand, package_image_url)")
      .eq("routine_id", params.id)
      .order("step_order", { ascending: true });

    const hydratedSteps = await attachFallbackProducts(
      supabase,
      routine.user_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (steps ?? []) as any[]
    );

    const imageKeys = Array.from(
      new Set(
        hydratedSteps.flatMap((step) => {
          const imagePath = step.product?.package_image_url;
          if (!imagePath || isDirectImageUrl(imagePath)) return [];
          const thumbPath = getProductImageThumbPathFromStoredPath(imagePath);
          return [thumbPath, imagePath];
        })
      )
    );
    const signedUrls = imageKeys.length > 0 ? await r2GetSignedUrls(imageKeys) : {};

    const allSteps = hydratedSteps.map((step) => {
      const imagePath = step.product?.package_image_url ?? null;
      const resolvedImage =
        imagePath && !isDirectImageUrl(imagePath)
          ? signedUrls[getProductImageThumbPathFromStoredPath(imagePath)] ??
            signedUrls[imagePath] ??
            null
          : imagePath;

      return {
        ...step,
        brand: step.product?.brand ?? null,
        package_image_url: resolvedImage ?? null,
      };
    }) as Step[];

    const selectedSteps = allSteps
      .filter((step) => step.time_of_day === cardMode)
      .slice(0, 5);
    const concerns = (routine.concerns as string[]) ?? [];
    const skinType = routine.skin_type ?? "乾燥肌";
    const cardLabel = getRoutineCardLabel(cardMode);
    const cardEmoji = getRoutineCardEmoji(cardMode);
    const heading = getRoutineCardHeading(cardMode);

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            background: "linear-gradient(135deg, #f0faf7, #e8f5f1)",
            padding: 56,
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
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 18 }}>
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
                  fontSize: 34,
                  fontWeight: 700,
                  color: "#1a2e28",
                  lineHeight: 1.3,
                  marginBottom: 12,
                }}
              >
                {cardEmoji} {heading}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,0.8)",
                    color: "#1a2e28",
                    fontSize: 18,
                    fontWeight: 700,
                    padding: "5px 16px",
                    borderRadius: 24,
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  {cardEmoji} {cardLabel}カード
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#3A8F7A15",
                    color: "#3A8F7A",
                    fontSize: 18,
                    fontWeight: 600,
                    padding: "5px 16px",
                    borderRadius: 24,
                  }}
                >
                  {skinType}
                </div>
                {concerns.slice(0, 3).map((concern: string) => (
                  <div
                    key={concern}
                    style={{
                      fontSize: 14,
                      padding: "4px 12px",
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.08)",
                      color: "#5a7a70",
                    }}
                  >
                    {concern}
                  </div>
                ))}
              </div>
            </div>

            <StepList steps={selectedSteps} />

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

function StepList({ steps }: { steps: Step[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
      {steps.length === 0 ? (
        <div style={{ fontSize: 18, color: "#5a7a70", opacity: 0.6 }}>
          このカードにはまだステップがありません
        </div>
      ) : (
        steps.map((step, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 14,
              background: "rgba(255,255,255,0.85)",
              borderRadius: 18,
              padding: "12px 14px",
              border: "1px solid rgba(0,0,0,0.06)",
              minHeight: 102,
            }}
          >
            <div
              style={{
                width: 76,
                height: 104,
                borderRadius: 16,
                overflow: "hidden",
                background: step.package_image_url ? "rgba(255,255,255,0.92)" : "#3A8F7A12",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                alignSelf: "center",
              }}
            >
              {step.package_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={step.package_image_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "center center",
                  }}
                />
              ) : (
                <span style={{ fontSize: 34 }}>{step.icon}</span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                minWidth: 0,
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "#3A8F7A12",
                  color: "#3A8F7A",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <span>{step.icon}</span>
                <span>{step.step_name}</span>
              </div>
              {step.brand && (
                <span style={{ fontSize: 12, color: "#5a7a70", lineHeight: 1.4 }}>
                  {step.brand}
                </span>
              )}
              <span
                style={{
                  fontSize: step.product_name ? 18 : 15,
                  fontWeight: step.product_name ? 700 : 600,
                  color: "#1a2e28",
                  lineHeight: 1.45,
                }}
              >
                {step.product_name ?? `${step.step_name}をセットしてください`}
              </span>
            </div>
          </div>
        ))
      )}
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
