# Soccer Commentary Lab

日本語のサッカー実況を入力すると、Premier League 風の英語実況へ変換して学べる Web サービスです。

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
