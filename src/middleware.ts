import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // CSP without nonce: Next.js production builds don't inject nonce attributes
  // into script tags, and Vercel caches HTML responses (making nonces stale).
  // Use 'unsafe-inline' for scripts until Next.js nonce support is reliable.
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // セッションのリフレッシュ（重要：getUser()を呼ぶことでトークンが自動更新される）
  await supabase.auth.getUser();

  // Set security headers on response
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
