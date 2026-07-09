import type { Metadata } from "next";

import { getCanonicalUrl, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
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
