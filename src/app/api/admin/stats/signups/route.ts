import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const RANGE_DAYS = 30;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function toJstDateKey(isoOrDate: string | Date): string {
  const t = (typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate).getTime() + JST_OFFSET_MS;
  const d = new Date(t);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  // JST「今日 0:00」を UTC ミリ秒で表現
  const nowJst = new Date(Date.now() + JST_OFFSET_MS);
  const todayJst0amUtcMs =
    Date.UTC(nowJst.getUTCFullYear(), nowJst.getUTCMonth(), nowJst.getUTCDate()) - JST_OFFSET_MS;
  const startUtcMs = todayJst0amUtcMs - (RANGE_DAYS - 1) * DAY_MS;
  const endUtcMs = todayJst0amUtcMs + DAY_MS; // 翌日 JST 0:00 (exclusive)
  const startUtcIso = new Date(startUtcMs).toISOString();
  const endUtcIso = new Date(endUtcMs).toISOString();

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("invite_activated_at")
    .not("invite_activated_at", "is", null)
    .gte("invite_activated_at", startUtcIso)
    .lt("invite_activated_at", endUtcIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  (data ?? []).forEach((row: { invite_activated_at: string | null }) => {
    if (!row.invite_activated_at) return;
    const key = toJstDateKey(row.invite_activated_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const daily: { date: string; count: number }[] = [];
  for (let i = RANGE_DAYS - 1; i >= 0; i--) {
    const dayUtcMs = todayJst0amUtcMs - i * DAY_MS;
    const key = toJstDateKey(new Date(dayUtcMs));
    daily.push({ date: key, count: counts.get(key) ?? 0 });
  }

  const total = daily.reduce((sum, d) => sum + d.count, 0);

  return NextResponse.json({ daily, total, rangeDays: RANGE_DAYS });
}
