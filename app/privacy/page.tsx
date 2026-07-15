import type { Metadata } from "next";
import Link from "next/link";

import { FadeIn } from "@/components/ui/motion";
import { getCanonicalUrl, SITE_NAME } from "@/lib/seo/site";

const PAGE_TITLE = "プライバシーポリシー";
const PAGE_DESCRIPTION =
  "KickLingoにおけるユーザーデータ・AI・アクセス解析の取り扱い";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: getCanonicalUrl("/privacy"),
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: getCanonicalUrl("/privacy"),
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <FadeIn>
          <header className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {PAGE_TITLE}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              KickLingo（以下「本サービス」）における情報の取り扱いについて説明します。
            </p>
            <p className="text-xs text-muted-foreground/80">
              最終更新日：2026年7月14日
            </p>
          </header>
        </FadeIn>

        <FadeIn delay={0.04}>
          <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
            <section className="space-y-2" aria-labelledby="privacy-overview">
              <h2
                id="privacy-overview"
                className="text-base font-semibold text-foreground"
              >
                サービス概要
              </h2>
              <p className="text-muted-foreground">
                本サービスは、日本語のサッカー実況を題材に、Premier
                League風の英語表現を学ぶためのWebサービスです。入力した日本語をもとに英語の実況表現を生成し、お気に入り・履歴・単語帳・クイズ・Daily
                Challengeなどで学習を続けられます。
              </p>
            </section>

            <section className="space-y-2" aria-labelledby="privacy-collect">
              <h2
                id="privacy-collect"
                className="text-base font-semibold text-foreground"
              >
                取得・利用する情報
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  Googleログインを利用した場合、認証に必要なユーザー情報（例：識別子、表示名、メールアドレス、プロフィール画像など、Googleおよび認証基盤から提供される範囲）
                </li>
                <li>ユーザーが入力した日本語の実況テキスト</li>
                <li>お気に入り（Favorites）に保存した英語表現など</li>
                <li>変換履歴（History）</li>
                <li>単語帳（Vocabulary）に保存した表現</li>
                <li>Daily Challengeの進行状況・回答・結果</li>
                <li>
                  Google
                  Analyticsによるアクセス状況に関する情報（ページ閲覧など）
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="privacy-storage">
              <h2
                id="privacy-storage"
                className="text-base font-semibold text-foreground"
              >
                保存場所
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  未ログイン時：お気に入り・履歴・単語帳・Daily
                  Challengeなどは、ご利用のブラウザ上（localStorage等）に保存されます。
                </li>
                <li>
                  ログイン時：上記のうちクラウドへ同期・保存されるデータは、ユーザー単位でSupabase上に保存されます。
                </li>
                <li>
                  アクセス解析：Google
                  Analyticsの仕組みに基づき、Google側で処理される場合があります。
                </li>
                <li>
                  AI処理：英語生成のため、入力した日本語テキストはOpenAIのAPIへ送信されます（生成処理に必要な範囲）。
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="privacy-ai">
              <h2
                id="privacy-ai"
                className="text-base font-semibold text-foreground"
              >
                OpenAI・AI生成内容について
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  変換ボタン押下時など、英語生成処理のために日本語入力がOpenAIへ送信されます。
                </li>
                <li>
                  氏名・連絡先・パスワード・その他の個人情報や機密情報は入力しないでください。
                </li>
                <li>
                  AIによる生成結果は、常に正確・自然であることを保証しません。学習の参考としてご利用ください。
                </li>
                <li>
                  生成された表現が、実際の実況や放送で必ず使用されるものであることは保証しません。
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="privacy-ga">
              <h2
                id="privacy-ga"
                className="text-base font-semibold text-foreground"
              >
                Google Analytics
              </h2>
              <p className="text-muted-foreground">
                本サービス改善のため、Google
                Analyticsによるアクセス解析を利用する場合があります。Cookieまたは類似の技術が利用されることがあり、取得・利用の詳細はGoogleのサービス仕様にも基づきます。
              </p>
            </section>

            <section className="space-y-2" aria-labelledby="privacy-delete">
              <h2
                id="privacy-delete"
                className="text-base font-semibold text-foreground"
              >
                データ保持・削除
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  ログアウトはセッション終了の操作であり、データの削除ではありません。
                </li>
                <li>
                  ブラウザに保存されたデータは、サイトデータ削除などで消去できる場合があります（端末・ブラウザごとに保持されます）。
                </li>
                <li>
                  ログイン後のクラウド保存データも、ログアウトだけでは削除されません。
                </li>
                <li>
                  クラウドデータの削除やアカウント削除の依頼方法・必要な記入内容は、
                  <Link
                    href="/contact"
                    className="font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400"
                  >
                    お問い合わせ
                  </Link>
                  をご覧ください。
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="privacy-contact">
              <h2
                id="privacy-contact"
                className="text-base font-semibold text-foreground"
              >
                お問い合わせ・関連ページ
              </h2>
              <p className="text-muted-foreground">
                本ポリシーや削除に関するご連絡は
                <Link
                  href="/contact"
                  className="font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400"
                >
                  お問い合わせ
                </Link>
                、利用上のルールは
                <Link
                  href="/terms"
                  className="font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400"
                >
                  利用規約
                </Link>
                をご覧ください。
              </p>
            </section>

            <section className="space-y-2" aria-labelledby="privacy-revise">
              <h2
                id="privacy-revise"
                className="text-base font-semibold text-foreground"
              >
                改定
              </h2>
              <p className="text-muted-foreground">
                本ポリシーの内容は、サービスの変更などに応じて改定することがあります。重要な変更がある場合は、本ページの更新によりお知らせします。
              </p>
            </section>
          </div>
        </FadeIn>
      </main>
    </div>
  );
}
