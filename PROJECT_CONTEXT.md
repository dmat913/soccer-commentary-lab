# KickLingo — プロジェクトコンテキスト

新しいチャットへ引き継ぐための要約ドキュメント。

## プロジェクト概要

日本語のサッカー実況を入力すると、OpenAI が Premier League 風の英語実況へ変換する Web 学習サービス。  
学習者が「実況英語」の語彙・ニュアンスの違いを比較しながら学べることを目的とする。

- ブランド名: `KickLingo`
- コードネーム / ディレクトリ: `soccer-commentary`
- 配置: `~/Projects/soccer-commentary`
- 現状: Discover MVP + Design System v1 リリース候補。Home / Favorites / History / Vocabulary / Discover / Quiz / Daily。データは localStorage + ログイン時 Supabase。

## コンセプト

- **直訳ではなく実況** — 翻訳ではなく、その場面を実況する英語を生成
- **3候補比較** — 同じ場面でもニュアンスの異なる実況表現を3つ提示
- **学習支援** — 各候補に日本語の意味・表現の解説・Learning Point（実況フレーズ）を付与
- **発音確認** — ブラウザ標準の読み上げで英語実況を聴ける
- **実例で深掘り** — YouTube 検索で実際の実況動画へ誘導
- **手軽な入力** — テキスト入力 + 音声入力（Web Speech API）

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| UI | shadcn/ui |
| AI | OpenAI SDK v6 (`gpt-4o-mini`) |
| 状態・永続化 | React state + localStorage |
| 音声入力 | Web Speech API — `SpeechRecognition`（`ja-JP`） |
| 音声読み上げ | Web Speech API — `SpeechSynthesis`（`en-US`） |
| 未導入 | Prisma、Stripe 課金 |

### 環境変数

```bash
# .env.local
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# 任意
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
```

読み上げ機能はクライアント側のみで動作するため、**追加の API キーは不要**。

### 主要コマンド

```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm run start        # 本番サーバー
npm test             # ユニットテスト
npm run lint         # ESLint
npm run test:openai  # OpenAI 接続テスト
```

## 画面構成

全ページで `SiteHeader` が共通表示される。Quiz / Daily（Focus Session）では Footer と Mobile Bottom Navigation を非表示にする。

| ルート | 役割 |
|--------|------|
| `/` | 実況変換（Hero・フォーム・結果）。おすすめ例文は約150件カタログから抽出 |
| `/favorites` | お気に入り一覧・Discover 公開 |
| `/history` | 履歴一覧・検索・restore |
| `/vocabulary` | 単語帳・Progress・今日の復習 |
| `/discover` | 公開フィード・Heard・検索・カテゴリ |
| `/quiz` | Practice Quiz（最大5問）。途中離脱確認あり |
| `/daily` | 今日のChallenge（1問） |

### 履歴 → Home 復元（restore 連携）

`/history` の履歴 Card をクリックすると `/?restore=<historyId>` へ遷移する。

Home 側（`HomeContent`）の処理:

1. `useSearchParams()` で `restore` クエリを読み取る
2. `useCommentaryHistory()` から該当 ID の履歴を検索
3. 見つかった場合、`japaneseText` と `translations` を `CommentaryForm` に反映
4. `TranslationCard` × 3 として表示（explanation / learningPoint / 読み上げ / お気に入りも通常どおり）
5. 復元後 `router.replace("/", { scroll: false })` で URL をクリーンアップ
6. 無効な `restore` ID の場合は何もしない（エラーなし）

`app/page.tsx` は `useSearchParams` 利用のため `Suspense` で `HomeContent` をラップしている。  
`HomeContent` は restore 対応とフォーム状態管理（`japaneseText` / `translations`）を担う。

**未実装:** `/history/[id]` 詳細ページ（現状は Home への restore 遷移で再表示）

## 現在実装済みの機能

### 変換フロー

1. 日本語実況を Textarea に入力（音声入力可）
2. 「変換」ボタン → Server Action 経由で OpenAI 呼び出し
3. 3件の `TranslationCard` で結果表示

### TranslationCard の内容

- 英語実況（大きめ表示）
- **🔊 再生ボタン** — `SpeechSynthesis` で `en-US` 読み上げ（再生中は「⏹ 停止」）
- 日本語の意味（`meaning`）
- **表現の解説**（`explanation`）— 2〜4文の日本語解説
- **Learning Point** — 実況でよく使うフレーズ（例: What a, Great, Superb）とその意味
- 「YouTubeで実況を探す」ボタン（新しいタブ）
- お気に入り ☆/★ トグル（右上）

`explanation` が空の場合は「表現の解説」セクションを非表示（旧お気に入りデータの後方互換）。

### その他

- **履歴** — 変換成功時に自動保存（最新10件）。`/history` で一覧表示、クリックで Home へ復元
- **お気に入り** — 翻訳候補1件単位で保存・解除（`explanation` / `learningPoint` 含む）。`/favorites` で一覧表示
- **音声入力** — `SpeechRecognition`（`ja-JP`、対応ブラウザのみ）
- **英語読み上げ** — `SpeechSynthesis`（`en-US`、対応ブラウザのみ、**サーバー変更不要**）
- **エラー表示** — API 失敗時に Card でメッセージ表示
- **サーバーログ** — `translate.ts` で入出力を `console.log` / `console.error`

### ブラウザ音声機能の動作確認

| 機能 | API | 確認状況 |
|------|-----|---------|
| 音声入力 | `SpeechRecognition` | 対応ブラウザで動作 |
| 英語読み上げ | `SpeechSynthesis` | **Chrome で動作確認済み** |

## ディレクトリ構成の要点

```
soccer-commentary/
├── app/
│   ├── layout.tsx              # ルートレイアウト（SiteHeader を全ページ共通表示）
│   ├── page.tsx                # Home（Suspense で HomeContent をラップ）
│   ├── favorites/
│   │   └── page.tsx            # お気に入り一覧
│   └── history/
│       └── page.tsx            # 履歴一覧（クリックで /?restore=<id> へ遷移）
├── components/
│   ├── layout/
│   │   └── site-header.tsx     # 共通ナビ（Home / Favorites / History）
│   ├── commentary/
│   │   ├── commentary-form.tsx       # 入力・変換・結果表示
│   │   ├── translation-card.tsx      # 1候補の Card UI
│   │   ├── commentary-history.tsx    # 履歴一覧 UI
│   │   ├── favorite-translations.tsx # お気に入り一覧 UI
│   │   ├── speech-input-button.tsx   # 音声入力ボタン
│   │   ├── speech-playback-button.tsx # 英語読み上げボタン
│   │   └── home-content.tsx          # Home 専用（restore + フォーム状態管理）
│   └── ui/                     # shadcn/ui コンポーネント
├── lib/
│   ├── commentary/translate.ts # OpenAI 呼び出し・パース（server-only）
│   ├── openai/client.ts        # OpenAI クライアント
│   ├── actions/commentary.ts   # Server Action
│   ├── history/storage.ts      # 履歴 localStorage
│   └── favorites/storage.ts    # お気に入り localStorage
├── hooks/
│   ├── use-commentary-history.ts
│   └── use-favorite-translations.ts
├── types/
│   ├── commentary.ts           # API 返却型
│   ├── history.ts
│   └── favorite.ts
└── scripts/test-openai.ts      # 接続テスト用
```

### データフロー

```
CommentaryForm (Client)
  → translateCommentaryAction (Server Action)
    → translate.ts (server-only)
      → OpenAI API (json_schema)
  ← { success, data: { translations } }
  → TranslationCard 表示
  → localStorage へ履歴保存

TranslationCard (Client)
  → SpeechPlaybackButton
    → SpeechSynthesis（ブラウザ標準、サーバー不要）

/history (Client)
  → 履歴 Card クリック
  → router.push("/?restore=<historyId>")
  → HomeContent が restore クエリを読み取り
  → useCommentaryHistory() から該当履歴を復元
  → router.replace("/") で URL クリーンアップ
```

**注意:** `translate.ts` は `server-only`。API キーをクライアントに露出させないため、必ず Server Action 経由で呼ぶ。  
読み上げはクライアント完結のため、Server Action や OpenAI には一切触れない。

## OpenAI の返却 JSON 構造

モデル: `gpt-4o-mini`  
形式: `response_format: json_schema`（strict）

```json
{
  "translations": [
    {
      "text": "What a strike!",
      "meaning": "なんて強烈なシュートだ！",
      "explanation": "strikeは単なるシュートではなく、威力や正確さを強調する言葉です。実況ではゴールに近い強烈な一打を伝えるときによく使われます。What a ...! の形は驚きや称賛を短く表す定番パターンで、覚えておくと現場感のある実況に使えます。",
      "learningPoint": {
        "text": "What a",
        "meaning": "実況でよく使う感嘆表現。驚きや称賛を短く伝える定番パターン"
      }
    }
  ]
}
```

- 常に **3件** の `translations` を返す
- `text` — 英語実況文
- `meaning` — その英語を自然な日本語にしたときの意味（1文）
- `explanation` — 表現の解説（2〜4文の日本語）。なぜこの英語になるか・実況でよく使われる理由・覚えておくポイントを含む
- `learningPoint.text` — その実況で覚えるべきフレーズ（例: Great, Superb, What a, Back of the net）
- `learningPoint.meaning` — フレーズの日本語説明

プロンプト詳細は [`lib/commentary/translate.ts`](lib/commentary/translate.ts) の `SYSTEM_PROMPT` を参照。

## localStorage で管理しているデータ

### 履歴

| 項目 | 値 |
|------|-----|
| キー | `soccer-commentary-history` |
| 最大件数 | 10件（新しい順） |
| 保存タイミング | 変換成功時に自動保存 |

```typescript
type CommentaryHistoryItem = {
  id: string;              // UUID
  japaneseText: string;    // 入力した日本語
  translations: CommentaryTranslationItem[];  // 3件まとめて（explanation 含む）
  savedAt: string;         // ISO 8601
};
```

実装: [`lib/history/storage.ts`](lib/history/storage.ts)

### お気に入り

| 項目 | 値 |
|------|-----|
| キー | `favorite-translations` |
| 保存単位 | 翻訳候補1件ごと |
| 重複ルール | 同じ `text` は登録不可 |
| 表示順 | 新しい順 |
| 後方互換 | `explanation` なしの旧データも読み込み可能 |

```typescript
type FavoriteTranslation = {
  id: string;              // UUID
  japaneseText: string;
  text: string;
  meaning: string;
  explanation?: string;    // 表現の解説（新規保存時に含む。旧データは undefined）
  learningPoint?: { text: string; meaning: string };
  /** @deprecated 旧データ互換用 */
  vocabulary?: { word: string; meaning: string };
  createdAt: string;       // ISO 8601
};
```

お気に入り追加時は `translation.explanation` と `learningPoint` も一緒に保存される。  
旧データ（`explanation` なし / `vocabulary` のみ）は `resolveLearningPoint()` で後方互換読み込み。

実装: [`lib/favorites/storage.ts`](lib/favorites/storage.ts)

### localStorage 更新パターン

履歴・お気に入りともに `useSyncExternalStore` + キャッシュ済みスナップショットで UI を同期。  
スナップショットを毎回新規配列で返すと無限ループになるため注意。

## 開発ルール

1. **1回の変更で1目的** — 機能追加・修正は単一の目的に絞る
2. **OpenAI / API / UI を同時に大きく変更しない** — 層ごとに分けて進める
3. **実装後はレビューしてから次へ** — `npm run lint` / `npm run build` で確認し、動作を見てから次タスクへ

### 変更時の目安

| 変更内容 | 触るファイル例 |
|---------|---------------|
| 画面・ナビ追加 | `app/*/page.tsx`, `components/layout/site-header.tsx` |
| 履歴復元 | `home-content.tsx`, `app/history/page.tsx` |
| プロンプト改善 | `lib/commentary/translate.ts` の `SYSTEM_PROMPT` のみ |
| API 返却形式変更 | `translate.ts` + `types/commentary.ts` + UI |
| UI のみ | `components/commentary/*` |
| 読み上げ・音声入力 | `speech-playback-button.tsx` / `speech-input-button.tsx`（クライアントのみ） |
| 永続化 | `lib/history/storage.ts` または `lib/favorites/storage.ts` + hooks |

## 次に実装予定の候補

優先度は未確定。以下は検討中の機能一覧。

| 候補 | 概要 |
|------|------|
| `/history/[id]` 詳細ページ | 履歴を Home 以外でも閲覧 |
| Repository 層 | localStorage を抽象化し Supabase 移行を容易に |
| お気に入り削除 UI 改善 | 一覧からの削除操作をわかりやすく |
| 検索機能 | Favorites / History の絞り込み |
| 読み上げ品質改善 | 音声選択・速度調整など |
| Supabase 移行 | localStorage → PostgreSQL |
| ログイン | ユーザー認証・端末間同期 |
| デプロイ | Vercel 等への本番公開 |

## 補足

- UI 言語: 日本語（`lang="ja"`）
- デザイン: エメラルドグリーン基調、レスポンシブ対応
- Home は変換に集中。履歴は `/history` でサマリー表示、お気に入りは `/favorites` で `TranslationCard` を再利用
- `/history/[id]` は未実装。履歴の再表示は Home への restore 遷移で対応
- 詳細な引き継ぎ情報は本ファイル（`PROJECT_CONTEXT.md`）を参照
