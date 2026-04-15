import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://*.r2.dev https://thumbnail.image.rakuten.co.jp https://*.rakuten.co.jp",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.dev https://api.twitter.com https://upload.twitter.com https://app.rakuten.co.jp",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // クライアントサイドナビゲーション（RSC payload）ではセッションリフレッシュをスキップ
  // クライアント側の AuthProvider が onAuthStateChange でトークン管理を行うため不要
  const isRscRequest = request.headers.get("rsc") !== null;
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback");

  const isPublicPath = ["/privacy", "/terms"].some((p) => request.nextUrl.pathname.startsWith(p));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && ((!isRscRequest && !isPublicPath) || isAuthCallback)) {
    try {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              supabaseResponse = NextResponse.next({
                request: { headers: requestHeaders },
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      // セッションのリフレッシュ（初回ページロード・auth callback時のみ）
      await supabase.auth.getUser();
    } catch (e) {
      console.error("Middleware: Supabase session refresh failed", e);
    }
  }

  supabaseResponse.headers.set("Content-Security-Policy", cspHeader);

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 静的ファイルと画像以外の全ルートにマッチ
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
