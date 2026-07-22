import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_RETURN_COOKIE_NAME,
  buildAuthCallbackRedirectUrl,
  clearAuthReturnPathCookieHeader,
  resolveAuthReturnPath,
} from "@/lib/auth/safe-redirect";
import { getSupabaseEnv } from "@/lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function applyCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}

function redirectWithinOrigin(
  request: NextRequest,
  next: string,
  cookiesToSet: CookieToSet[] = []
) {
  const response = NextResponse.redirect(
    buildAuthCallbackRedirectUrl(request.nextUrl, next)
  );
  applyCookies(response, cookiesToSet);

  const clearReturn = clearAuthReturnPathCookieHeader();
  response.cookies.set(clearReturn.name, clearReturn.value, clearReturn.options);

  return response;
}

export async function GET(request: NextRequest) {
  const env = getSupabaseEnv();

  if (!env) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
      },
      { status: 500 }
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const next = resolveAuthReturnPath({
    cookieValue: request.cookies.get(AUTH_RETURN_COOKIE_NAME)?.value,
    queryValue: request.nextUrl.searchParams.get("next"),
  });

  if (!code) {
    return redirectWithinOrigin(request, "/?auth_error=sign_in_failed");
  }

  const pendingCookies: CookieToSet[] = [];

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.splice(0, pendingCookies.length, ...cookiesToSet);
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectWithinOrigin(request, "/?auth_error=sign_in_failed");
  }

  return redirectWithinOrigin(request, next, pendingCookies);
}
