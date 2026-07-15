import Link from "next/link";

export function HomeAiDisclaimer() {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
      入力内容はAIによる英語生成のため外部サービスへ送信されます。個人情報や機密情報は入力せず、生成結果は学習の参考としてご利用ください。取り扱いの詳細は
      <Link
        href="/privacy"
        className="font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400"
      >
        プライバシーポリシー
      </Link>
      をご覧ください。
    </p>
  );
}
