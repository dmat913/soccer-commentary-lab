const DEFAULT_AUTH_RETURN_PATH = "/";

/** Cookie that stores the post-login path without putting it on redirect_to. */
export const AUTH_RETURN_COOKIE_NAME = "kicklingo_auth_next";

const AUTH_RETURN_COOKIE_MAX_AGE_SECONDS = 60 * 10;

function hasDisallowedScheme(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);
}

/**
 * Restricts post-auth redirects to same-origin relative paths.
 * Rejects absolute URLs, protocol-relative URLs, and javascript: payloads.
 */
export function sanitizeAuthReturnPath(
  next: string | null | undefined,
  defaultPath: string = DEFAULT_AUTH_RETURN_PATH
): string {
  if (!next) {
    return defaultPath;
  }

  let path = next.trim();

  if (!path) {
    return defaultPath;
  }

  if (hasDisallowedScheme(path) || path.startsWith("//")) {
    return defaultPath;
  }

  try {
    const decoded = decodeURIComponent(path);
    if (decoded !== path) {
      path = decoded.trim();
      if (!path || hasDisallowedScheme(path) || path.startsWith("//")) {
        return defaultPath;
      }
    }
  } catch {
    return defaultPath;
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return defaultPath;
  }

  return path;
}

/**
 * Builds the OAuth callback URL for a browser origin.
 *
 * Must match the Supabase Redirect URLs allowlist exactly (no ?next= query).
 * Callers must pass click-time `window.location.origin` — never SEO SITE_URL.
 */
export function buildAuthCallbackUrl(origin: string): string {
  return new URL("/auth/callback", origin).toString();
}

/**
 * Ensures the Supabase authorize URL's redirect_to matches the intended callback.
 */
export function forceAuthAuthorizeRedirectTo(
  authorizeUrl: string,
  expectedRedirectTo: string
): string {
  const url = new URL(authorizeUrl);
  url.searchParams.set("redirect_to", expectedRedirectTo);
  return url.toString();
}

/**
 * Builds the post-exchange redirect URL from the callback request origin.
 */
export function buildAuthCallbackRedirectUrl(
  requestUrl: string | URL,
  next: string | null | undefined
): URL {
  const base = typeof requestUrl === "string" ? new URL(requestUrl) : requestUrl;
  const safeNext = sanitizeAuthReturnPath(next, DEFAULT_AUTH_RETURN_PATH);
  return new URL(safeNext, base.origin);
}

/**
 * Resolves the post-login path from cookie (preferred) or legacy ?next= query.
 */
export function resolveAuthReturnPath(params: {
  cookieValue?: string | null;
  queryValue?: string | null;
}): string {
  return sanitizeAuthReturnPath(
    params.cookieValue ?? params.queryValue,
    DEFAULT_AUTH_RETURN_PATH
  );
}

/**
 * Persists the return path in a short-lived SameSite=Lax cookie before OAuth.
 * Keeps redirect_to identical to the Dashboard allowlist entry.
 */
export function persistAuthReturnPath(returnTo?: string | null): void {
  if (typeof document === "undefined") {
    return;
  }

  const path = sanitizeAuthReturnPath(returnTo, DEFAULT_AUTH_RETURN_PATH);
  document.cookie = [
    `${AUTH_RETURN_COOKIE_NAME}=${encodeURIComponent(path)}`,
    "Path=/",
    `Max-Age=${AUTH_RETURN_COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
}

export function clearAuthReturnPathCookieHeader(): {
  name: string;
  value: string;
  options: {
    path: string;
    maxAge: number;
  };
} {
  return {
    name: AUTH_RETURN_COOKIE_NAME,
    value: "",
    options: {
      path: "/",
      maxAge: 0,
    },
  };
}
