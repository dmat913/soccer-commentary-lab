export const SITE_URL = "https://soccer-commentary-lab.vercel.app";

export const SITE_NAME = "KickLingo";

export const SITE_TITLE = "KickLingo | サッカー実況を英語で学ぶ";

export const SITE_DESCRIPTION =
  "日本語のサッカー実況をPremier League風の自然な英語実況へ変換。実況英語を学べる無料Webサービス。";

export const SITE_KEYWORDS = [
  "サッカー英語",
  "サッカー実況",
  "英語実況",
  "Football Commentary",
  "Premier League",
  "Soccer Commentary",
  "English Learning",
  "AI英語学習",
] as const;

export const SITE_AUTHOR = "Daiki Yamaguchi";

export const GOOGLE_SITE_VERIFICATION =
  "XFB_yeIFbgmovtU0Rf9L0z1pi2v2h6C15SX-mBtUJc8";

export type SitemapRoute = {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};

/**
 * Public marketing / legal routes for search indexing.
 * Personalized or app-shell routes (/favorites, /history, /quiz, /daily,
 * /vocabulary) are intentionally omitted and marked noindex in their layouts.
 */
export const SITEMAP_ROUTES: SitemapRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.4 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.3 },
];

export function getCanonicalUrl(path: string): string {
  if (path === "/") {
    return SITE_URL;
  }

  return `${SITE_URL}${path}`;
}
