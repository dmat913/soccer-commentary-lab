export const SITE_URL = "https://soccer-commentary-lab.vercel.app";

export const SITE_NAME = "Soccer Commentary Lab";

export const SITE_TITLE = "Soccer Commentary Lab | サッカー実況を英語で学ぶ";

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

/** 公開ページの sitemap 定義。ページ追加時はここに path を足してください。 */
export const SITEMAP_ROUTES: SitemapRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/favorites", changeFrequency: "weekly", priority: 0.8 },
  { path: "/history", changeFrequency: "weekly", priority: 0.8 },
];

export function getCanonicalUrl(path: string): string {
  if (path === "/") {
    return SITE_URL;
  }

  return `${SITE_URL}${path}`;
}
