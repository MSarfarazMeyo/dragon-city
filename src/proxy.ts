import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No-op until the project is linked and .env.local is populated
  // (see .env.local.example) — keeps `npm run dev` usable before Sprint 0.
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPath = pathname === "/login";

  if (!user) {
    if (!isLoginPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Signed in — figure out where this role belongs.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  const isPortalPath = pathname.startsWith("/portal");
  const isMerchant = role === "merchant";

  if (isLoginPath) {
    return NextResponse.redirect(new URL(isMerchant ? "/portal" : "/map", request.url));
  }

  if (isMerchant && !isPortalPath && pathname !== "/") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (!isMerchant && isPortalPath) {
    return NextResponse.redirect(new URL("/map", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
