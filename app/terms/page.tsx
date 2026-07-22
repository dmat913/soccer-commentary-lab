import type { Metadata } from "next";
import Link from "next/link";

import { FadeIn } from "@/components/ui/fade-in";
import { getCanonicalUrl, SITE_NAME } from "@/lib/seo/site";

const PAGE_TITLE = "利用規約";
const PAGE_DESCRIPTION =
  "KickLingoの利用条件・禁止事項・AI生成内容に関する規約";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: getCanonicalUrl("/terms"),
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: getCanonicalUrl("/terms"),
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <FadeIn>
          <header className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {PAGE_TITLE}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              KickLingo（以下「本サービス」）をご利用いただく際の条件を定めます。本サービスを利用することで、本規約に同意したものとみなします。
            </p>
            <p className="text-xs text-muted-foreground/80">
              最終更新日：2026年7月14日
            </p>
          </header>
        </FadeIn>

        <FadeIn delay={0.04}>
          <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
            <section className="space-y-2" aria-labelledby="terms-purpose">
              <h2
                id="terms-purpose"
                className="text-base font-semibold text-foreground"
              >
                サービスの目的
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  本サービスは、サッカー実況を題材に英語表現を学習するためのWebサービスです。
                </li>
                <li>
                  学習支援を目的としており、専門的な翻訳・通訳サービスではありません。
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="terms-conditions">
              <h2
                id="terms-conditions"
                className="text-base font-semibold text-foreground"
              >
                利用条件
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>ユーザーご自身の責任において本サービスを利用してください。</li>
                <li>
                  個人情報・機密情報・第三者の権利を侵害する情報を入力しないでください。
                </li>
                <li>法令や公序良俗に反する利用をしないでください。</li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="terms-ai">
              <h2
                id="terms-ai"
                className="text-base font-semibold text-foreground"
              >
                AI生成内容
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  英語実況などの結果は、AI（外部の生成サービスを含む）により生成されます。
                </li>
                <li>
                  正確性・自然さ、および実際の実況や放送での使用を保証しません。
                </li>
                <li>
                  重要な判断や用途では、利用者ご自身で内容を確認してください。
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="terms-prohibited">
              <h2
                id="terms-prohibited"
                className="text-base font-semibold text-foreground"
              >
                禁止事項
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>不正アクセスや、サービス運営を妨害する行為</li>
                <li>APIや機能の過剰利用など、過度な負荷をかける行為</li>
                <li>他者へのなりすまし</li>
                <li>第三者の権利を侵害する行為</li>
                <li>違法・不適切なコンテンツの入力</li>
                <li>
                  サービスの不当な解析・複製など、運営を害する行為
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="terms-change">
              <h2
                id="terms-change"
                className="text-base font-semibold text-foreground"
              >
                サービスの変更・停止
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  機能や提供内容を、事前の通知なく変更・停止する場合があります。
                </li>
                <li>
                  保存データの完全な保持を保証するものではありません。
                </li>
                <li>
                  重要な学習データは、利用者ご自身でも別途管理することを推奨します。
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="terms-disclaimer">
              <h2
                id="terms-disclaimer"
                className="text-base font-semibold text-foreground"
              >
                免責
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  本サービスの利用により生じた損害について、法令上許される範囲で責任を負わないものとします。
                </li>
                <li>
                  外部サービス（認証・データベース・AI・アクセス解析など）の障害や仕様変更により、本サービスが影響を受ける場合があります。
                </li>
                <li>
                  AI生成結果を用いた学習以外の判断・行為については、利用者ご自身の責任とします。
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="terms-related">
              <h2
                id="terms-related"
                className="text-base font-semibold text-foreground"
              >
                関連ページ
              </h2>
              <p className="text-muted-foreground">
                データの取り扱いについては
                <Link
                  href="/privacy"
                  className="font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400"
                >
                  プライバシーポリシー
                </Link>
                、削除やお問い合わせについては
                <Link
                  href="/contact"
                  className="font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400"
                >
                  お問い合わせ
                </Link>
                をご覧ください。
              </p>
            </section>

            <section className="space-y-2" aria-labelledby="terms-revise">
              <h2
                id="terms-revise"
                className="text-base font-semibold text-foreground"
              >
                規約の変更
              </h2>
              <p className="text-muted-foreground">
                本規約は必要に応じて変更する場合があります。変更後の内容は、本ページに掲載した時点から効力を生じるものとします。
              </p>
            </section>
          </div>
        </FadeIn>
      </main>
    </div>
  );
}
