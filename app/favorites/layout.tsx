import type { Metadata } from "next";

import { getCanonicalUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `お気に入り | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: getCanonicalUrl("/favorites"),
  },
  openGraph: {
    url: getCanonicalUrl("/favorites"),
  },
};

export default function FavoritesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
