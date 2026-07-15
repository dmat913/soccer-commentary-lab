import type { Metadata } from "next";
import Link from "next/link";

import { FadeIn } from "@/components/ui/motion";
import { CONTACT_EMAIL, getContactMailtoHref } from "@/lib/site/contact";
import { getCanonicalUrl, SITE_NAME } from "@/lib/seo/site";

const PAGE_TITLE = "お問い合わせ";
const PAGE_DESCRIPTION =
  "KickLingoへの問い合わせ・不具合報告・データ削除依頼";

const DATA_DELETE_SUBJECT = "【KickLingo】保存データ削除依頼";
const ACCOUNT_DELETE_SUBJECT = "【KickLingo】アカウント削除依頼";

const DATA_DELETE_BODY = `以下をご記入のうえ送信してください。

・Googleログインで使用しているメールアドレス：
・削除を希望する対象（例：Favorites / History / Vocabulary / Daily Challenge / すべて）：
・その他の補足：

※本人確認に必要以上の個人情報は送らないでください。`;

const ACCOUNT_DELETE_BODY = `以下をご記入のうえ送信してください。

・Googleログインで使用しているメールアドレス：
・アカウント削除の希望：はい
・あわせて削除を希望するクラウド保存データ（任意）：
・その他の補足：

※本人確認に必要以上の個人情報は送らないでください。
※アカウント削除を依頼する場合、関連するクラウド保存データも対象になることがあります。削除後は復元できない可能性があります。`;

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: getCanonicalUrl("/contact"),
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: getCanonicalUrl("/contact"),
  },
};

const linkClassName =
  "font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400";

export default function ContactPage() {
  const generalMailto = getContactMailtoHref("【KickLingo】お問い合わせ");
  const dataDeleteMailto = getContactMailtoHref(
    DATA_DELETE_SUBJECT,
    DATA_DELETE_BODY
  );
  const accountDeleteMailto = getContactMailtoHref(
    ACCOUNT_DELETE_SUBJECT,
    ACCOUNT_DELETE_BODY
  );
  const hasEmail = Boolean(CONTACT_EMAIL.trim());

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <FadeIn>
          <header className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {PAGE_TITLE}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              サービスに関するご質問・不具合報告・保存データやアカウントの削除依頼は、メールにて受け付けます。
            </p>
          </header>
        </FadeIn>

        <FadeIn delay={0.04}>
          <div className="space-y-8 text-sm leading-relaxed">
            <section className="space-y-2" aria-labelledby="contact-topics">
              <h2
                id="contact-topics"
                className="text-base font-semibold text-foreground"
              >
                受付内容の例
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>サービスに関する問い合わせ</li>
                <li>不具合報告</li>
                <li>データ削除依頼</li>
                <li>アカウント削除依頼</li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="contact-browser">
              <h2
                id="contact-browser"
                className="text-base font-semibold text-foreground"
              >
                ブラウザに保存されたデータ
              </h2>
              <p className="text-muted-foreground">
                未ログイン時のお気に入り（Favorites）、履歴（History）、単語帳（Vocabulary）、Daily
                Challengeなどは、ご利用のブラウザ（localStorage等）に保存されます。
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  ブラウザのサイトデータ削除やlocalStorageの消去で消せる場合があります。
                </li>
                <li>保存内容はブラウザや端末ごとに分かれます。</li>
                <li>
                  ログアウトはセッション終了であり、ブラウザ内のデータ削除ではありません。
                </li>
              </ul>
            </section>

            <section className="space-y-2" aria-labelledby="contact-cloud">
              <h2
                id="contact-cloud"
                className="text-base font-semibold text-foreground"
              >
                クラウドに保存されたデータ
              </h2>
              <p className="text-muted-foreground">
                Googleログイン後に同期・保存されたFavorites、History、Vocabulary、Daily
                Challengeなどは、ユーザー単位でクラウド（Supabase）に保存されます。
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>ログアウトだけではクラウド上のデータは削除されません。</li>
                <li>
                  削除を希望する場合は、下記からメールで依頼してください（セルフサービスでの即時削除機能はありません）。
                </li>
                <li>
                  アカウント削除を依頼する場合、関連するクラウド保存データも対象になることがあります。
                </li>
                <li>削除完了後は、復元できない可能性があります。</li>
              </ul>
            </section>

            <section className="space-y-3" aria-labelledby="contact-mail">
              <h2
                id="contact-mail"
                className="text-base font-semibold text-foreground"
              >
                連絡方法
              </h2>
              {hasEmail && generalMailto ? (
                <p className="text-muted-foreground">
                  一般的なお問い合わせは、
                  <a
                    href={generalMailto}
                    className={linkClassName}
                    aria-label={`${SITE_NAME}への問い合わせメールを作成（${CONTACT_EMAIL}）`}
                  >
                    {CONTACT_EMAIL}
                  </a>
                  宛にお送りください。
                </p>
              ) : (
                <p
                  role="status"
                  className="rounded-xl border border-dashed border-emerald-200/80 bg-emerald-50/40 px-4 py-3 text-muted-foreground dark:border-emerald-900/50 dark:bg-emerald-950/20"
                >
                  公開用の問い合わせメールアドレスは、まだ設定されていません。公開前に{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                    lib/site/contact.ts
                  </code>{" "}
                  の{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                    CONTACT_EMAIL
                  </code>{" "}
                  を設定してください。設定がない間は、削除依頼用のメール導線も利用できません。
                </p>
              )}

              {hasEmail && dataDeleteMailto && accountDeleteMailto ? (
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <a
                      href={dataDeleteMailto}
                      className={linkClassName}
                      aria-label="保存データ削除依頼のメールを作成"
                    >
                      保存データ削除を依頼する
                    </a>
                  </li>
                  <li>
                    <a
                      href={accountDeleteMailto}
                      className={linkClassName}
                      aria-label="アカウント削除依頼のメールを作成"
                    >
                      アカウント削除を依頼する
                    </a>
                  </li>
                </ul>
              ) : null}

              <p className="text-muted-foreground">
                内容の確認や対応にはお時間をいただく場合があります。あらかじめご了承ください。固定の対応日数はお約束できません。
              </p>
            </section>

            <p className="text-muted-foreground">
              データの取り扱いの詳細は
              <Link href="/privacy" className={linkClassName}>
                プライバシーポリシー
              </Link>
              、利用上のルールは
              <Link href="/terms" className={linkClassName}>
                利用規約
              </Link>
              をご覧ください。
            </p>
          </div>
        </FadeIn>
      </main>
    </div>
  );
}
