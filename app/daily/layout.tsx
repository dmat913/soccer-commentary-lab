import type { Metadata } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `今日のChallenge | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
};

export default function DailyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
