import type { Metadata } from "next";

import { getCanonicalUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Discover | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: getCanonicalUrl("/discover"),
  },
  openGraph: {
    url: getCanonicalUrl("/discover"),
  },
};

export default function DiscoverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
