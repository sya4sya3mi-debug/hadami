import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getRegistrationAvailability } from "@/lib/registration";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const response = NextResponse.redirect(`${origin}/`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionData?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", sessionData.user.id)
        .single();

      if (!profile?.display_name) {
        // getRegistrationAvailability が失敗しても 500 にしない
        let allowed = true;
        try {
          const result = await getRegistrationAvailability();
          allowed = result.allowed;
        } catch {
          // 可用性チェック失敗時は通過させてプロフィール設定へ
          allowed = true;
        }

        if (!allowed) {
          await supabase.auth.signOut();
          response.headers.set("Location", `${origin}/auth/login?error=registration_limit_reached`);
          return response;
        }

        response.headers.set("Location", `${origin}/auth/profile`);
        return response;
      }
    }

    return response;
  }

  return NextResponse.redirect(`${origin}/`);
}
