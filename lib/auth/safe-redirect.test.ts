import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAuthCallbackRedirectUrl,
  buildAuthCallbackUrl,
  forceAuthAuthorizeRedirectTo,
  resolveAuthReturnPath,
  sanitizeAuthReturnPath,
} from "@/lib/auth/safe-redirect";

describe("sanitizeAuthReturnPath", () => {
  it("allows internal paths", () => {
    assert.equal(sanitizeAuthReturnPath("/discover"), "/discover");
    assert.equal(sanitizeAuthReturnPath("/favorites"), "/favorites");
    assert.equal(
      sanitizeAuthReturnPath("/vocabulary?tab=learning"),
      "/vocabulary?tab=learning"
    );
  });

  it("rejects external and protocol-relative targets", () => {
    assert.equal(sanitizeAuthReturnPath("https://example.com"), "/");
    assert.equal(sanitizeAuthReturnPath("//evil.example"), "/");
    assert.equal(sanitizeAuthReturnPath("javascript:alert(1)"), "/");
    assert.equal(sanitizeAuthReturnPath("%2F%2Fevil.example"), "/");
  });

  it("falls back for empty values", () => {
    assert.equal(sanitizeAuthReturnPath(null), "/");
    assert.equal(sanitizeAuthReturnPath(""), "/");
    assert.equal(sanitizeAuthReturnPath("   "), "/");
  });
});

describe("buildAuthCallbackUrl", () => {
  it("uses exact localhost callback without query params", () => {
    assert.equal(
      buildAuthCallbackUrl("http://localhost:3000"),
      "http://localhost:3000/auth/callback"
    );
  });

  it("uses exact production callback without hardcoding SITE_URL", () => {
    assert.equal(
      buildAuthCallbackUrl("https://soccer-commentary-lab.vercel.app"),
      "https://soccer-commentary-lab.vercel.app/auth/callback"
    );
  });

  it("never invents a production origin from a localhost call", () => {
    const callbackUrl = buildAuthCallbackUrl("http://localhost:3000");
    assert.equal(callbackUrl.includes("vercel.app"), false);
    assert.equal(callbackUrl.includes("?"), false);
  });
});

describe("resolveAuthReturnPath", () => {
  it("prefers cookie over query for discover and favorites", () => {
    assert.equal(
      resolveAuthReturnPath({
        cookieValue: "/discover",
        queryValue: "/favorites",
      }),
      "/discover"
    );
    assert.equal(
      resolveAuthReturnPath({
        cookieValue: "/favorites",
        queryValue: null,
      }),
      "/favorites"
    );
  });

  it("falls back to query when cookie is missing", () => {
    assert.equal(
      resolveAuthReturnPath({
        cookieValue: null,
        queryValue: "/discover",
      }),
      "/discover"
    );
  });

  it("rejects unsafe values from cookie or query", () => {
    assert.equal(
      resolveAuthReturnPath({
        cookieValue: "https://evil.example",
        queryValue: "//evil.example",
      }),
      "/"
    );
  });
});

describe("forceAuthAuthorizeRedirectTo", () => {
  it("overwrites a production redirect_to with the exact localhost callback", () => {
    const authorizeUrl =
      "https://xbnnrlzjyrmdmjydhjfa.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fsoccer-commentary-lab.vercel.app%2Fauth%2Fcallback";
    const expected = "http://localhost:3000/auth/callback";
    const forced = forceAuthAuthorizeRedirectTo(authorizeUrl, expected);
    const redirectTo = new URL(forced).searchParams.get("redirect_to");
    assert.equal(redirectTo, expected);
    assert.equal(redirectTo?.includes("vercel.app"), false);
    assert.equal(redirectTo?.includes("?"), false);
  });
});

describe("buildAuthCallbackRedirectUrl", () => {
  it("redirects within the callback request origin", () => {
    assert.equal(
      buildAuthCallbackRedirectUrl(
        "http://localhost:3000/auth/callback?code=abc",
        "/discover"
      ).toString(),
      "http://localhost:3000/discover"
    );
    assert.equal(
      buildAuthCallbackRedirectUrl(
        "http://localhost:3000/auth/callback?code=abc",
        "/favorites"
      ).toString(),
      "http://localhost:3000/favorites"
    );
    assert.equal(
      buildAuthCallbackRedirectUrl(
        "https://production-domain.example/auth/callback?code=abc",
        "/discover"
      ).toString(),
      "https://production-domain.example/discover"
    );
  });

  it("keeps exchange-failure redirects on the same origin", () => {
    assert.equal(
      buildAuthCallbackRedirectUrl(
        "http://localhost:3000/auth/callback?code=abc",
        "/?auth_error=sign_in_failed"
      ).toString(),
      "http://localhost:3000/?auth_error=sign_in_failed"
    );
  });

  it("blocks open redirects after OAuth exchange", () => {
    assert.equal(
      buildAuthCallbackRedirectUrl(
        "http://localhost:3000/auth/callback?code=abc",
        "https://evil.example"
      ).toString(),
      "http://localhost:3000/"
    );
    assert.equal(
      buildAuthCallbackRedirectUrl(
        "http://localhost:3000/auth/callback?code=abc",
        "//evil.example"
      ).toString(),
      "http://localhost:3000/"
    );
  });
});
