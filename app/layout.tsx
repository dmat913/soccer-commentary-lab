import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppGoogleAnalytics } from "@/components/analytics/app-google-analytics";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppChrome } from "@/components/layout/app-chrome";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { QuizLeaveGuardProvider } from "@/components/quiz/quiz-leave-guard-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LazyToaster } from "@/components/ui/lazy-toaster";
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
      <body className="flex min-h-full flex-col">
        <AuthProvider initialUser={initialUser}>
          <QuizLeaveGuardProvider>
            <SiteHeader />
            <AppChrome footer={<SiteFooter />} bottomNav={<MobileBottomNav />}>
              {children}
            </AppChrome>
            <LazyToaster
              position="bottom-center"
              richColors
              closeButton
              offset={{
                bottom: "calc(3.75rem + env(safe-area-inset-bottom))",
              }}
              mobileOffset={{
                bottom: "calc(3.75rem + env(safe-area-inset-bottom))",
              }}
            />
          </QuizLeaveGuardProvider>
        </AuthProvider>
        <AppGoogleAnalytics />
      </body>
    </html>
  );
}
