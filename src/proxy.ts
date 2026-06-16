import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isProtected =
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/update-password");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);

    // Clear stale auth cookies to prevent repeated refresh_token_not_found errors
    if (error) {
      request.cookies.getAll().forEach(({ name }) => {
        if (name.startsWith("sb-")) {
          redirectResponse.cookies.delete(name);
        }
      });
    }

    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
