# KickLingo

KickLingo は、日本語のサッカー実況を入力すると、Premier League 風の英語実況へ変換して学べる Web サービスです。

## 主な機能

- 日本語実況 → 英語実況へ3候補変換（OpenAI `gpt-4o-mini`）
- 各候補に意味・**表現の解説**・重要単語を表示
- **英語読み上げ**（ブラウザ標準 `SpeechSynthesis`、APIキー不要）
- 音声入力（`SpeechRecognition`）
- お気に入り・履歴（localStorage）
- YouTube で実況動画を検索

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local に OPENAI_API_KEY を設定
npm run dev
```

http://localhost:3000 を開いて利用します。

## Google Analytics (GA4)

アクセス解析には Google Analytics 4 を利用します。Measurement ID は環境変数から読み込みます。

### ローカル設定

1. `.env.local` を作成（存在しなければ `cp .env.example .env.local`）
2. 以下を設定する

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-GF7Q1Y2P6X
```

3. 開発サーバーを再起動する（`npm run dev`）
4. ブラウザでサイトを開き、Google Analytics のリアルタイム画面でアクセスを確認する

**重要:** `NEXT_PUBLIC_*` は **ビルド時** に埋め込まれます。Vercel では環境変数を追加・変更したあと、**Production を再デプロイ**してください。反映されない場合は **Clear build cache** 付きで再デプロイしてください。

未設定の場合は `GoogleAnalytics` コンポーネントは描画されません。

### Vercel 設定

Vercel の **Environment Variables** に以下を追加します。

| Name | Value |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-GF7Q1Y2P6X` |

デプロイ後、本番 URL でアクセスし、Google Analytics のリアルタイム画面で確認してください。

環境変数を追加しただけでは反映されません。必ず **Production の再ビルド・再デプロイ** を行ってください（必要なら **Clear build cache** を有効にする）。

## コマンド

```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm run test:openai  # OpenAI 接続テスト
```

## 技術スタック

Next.js 16 (App Router) / TypeScript / Tailwind CSS / shadcn/ui / OpenAI SDK

## ドキュメント

開発の引き継ぎ・仕様の詳細は [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) を参照してください。

## 公開前チェックリスト

Vercel へデプロイする前に、以下を確認してください。

### ビルド・環境変数

- [ ] `npm run build` が成功すること
- [ ] `.env.local` に `OPENAI_API_KEY` が設定されていること
- [ ] Vercel の Environment Variables に `OPENAI_API_KEY` を設定すること
- [ ] （任意）`NEXT_PUBLIC_GA_MEASUREMENT_ID` をローカル / Vercel に設定し、GA4 リアルタイムでアクセスが記録されること

### 主要機能

- [ ] `/` で日本語実況を入力し、変換できること
- [ ] `/favorites` でお気に入り一覧が表示されること
- [ ] `/history` で履歴一覧が表示されること
- [ ] `/history` の履歴をクリックし、`/?restore=<historyId>` 経由で Home に過去の変換結果が復元されること
- [ ] OpenAI API が失敗したとき、エラーメッセージが画面に表示されること

### レイアウト・UI

- [ ] 375px / 430px / 768px / 1024px の各幅でレイアウト崩れがないこと
- [ ] モバイル Header のハンバーガーメニューが開閉できること
- [ ] ハンバーガーメニュー内のリンクを押すとページ遷移し、メニューが閉じること
- [ ] Footer が全ページ（`/` / `/favorites` / `/history`）で自然に表示されること
