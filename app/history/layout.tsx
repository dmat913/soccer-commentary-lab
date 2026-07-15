import type { Metadata } from "next";

import { getCanonicalUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `履歴 | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: getCanonicalUrl("/history"),
  },
  openGraph: {
    url: getCanonicalUrl("/history"),
  },
};

export default function HistoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
