import type { Metadata } from "next";

import { getCanonicalUrl, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
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
