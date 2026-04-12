import { NextResponse } from "next/server";
import { BETA_USER_LIMIT } from "@/lib/limits";
import { getRegistrationAvailability } from "@/lib/registration";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { allowed, count, limit } = await getRegistrationAvailability();
    return NextResponse.json({ allowed, count, limit });
  } catch (error) {
    console.error("Failed to check registration availability:", error);
    return NextResponse.json(
      { allowed: false, count: BETA_USER_LIMIT, limit: BETA_USER_LIMIT },
      { status: 500 }
    );
  }
}
