import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppGoogleAnalytics } from "@/components/analytics/app-google-analytics";
import { AuthProvider } from "@/components/auth/auth-provider";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { getUser } from "@/lib/auth/get-user";
import { metadata as siteMetadata } from "@/lib/seo/metadata";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = siteMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getUser();

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <AuthProvider initialUser={initialUser}>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <MobileBottomNav />
          <Toaster position="bottom-center" richColors closeButton />
        </AuthProvider>
        <AppGoogleAnalytics />
      </body>
    </html>
  );
}
