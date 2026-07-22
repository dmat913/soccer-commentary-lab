# KickLingo — Project Context

Version: 1.0

Last Updated: 2026-07-22

---

# プロジェクト概要

KickLingo は、日本語のサッカー実況を

Premier League風の自然な英語実況へ変換し、

英語学習を支援するWebサービスです。

翻訳ではなく、

「実況で実際に使われる英語」を学ぶことを目的としています。

公開URL

[https://soccer-commentary-lab.vercel.app/](https://soccer-commentary-lab.vercel.app/)

---

# コンセプト

ユーザーは

日本語実況

↓

AIによる英語実況3候補

↓

意味・ニュアンス・学習ポイント

を比較しながら学習します。

---

# 技術スタック

Frontend

- Next.js (App Router)

- React

- TypeScript

- Tailwind CSS

Backend

- Server Actions

- OpenAI API

Authentication

- Supabase Auth

- Google OAuth

Hosting

- Vercel

Storage

現在

- localStorage

今後

- Supabase Database

---

# 現在実装済み

## MVP

- 実況変換

- OpenAI API

- Server Action

- 3候補生成

## UI

- Home

- Header

- Favorites

- History

## 音声

- マイク入力

## Favorites

- localStorage保存

- 重複防止

- 即時反映

## History

- localStorage保存

- restore機能

## Auth

- Googleログイン

- Googleログアウト

- AuthProvider

- middleware

- OAuth callback

## Discover MVP

- 公開フィード（トレンド / 新着 / 人気）

- Heard / 単語帳追加

- カテゴリ・検索

## Design System v1

- surfaces / category / vocabulary-status トークン

## Vocabulary / Quiz / Daily

- 単語帳（Progress・今日の復習）

- Practice Quiz（最大5問・途中離脱確認）

- 今日のChallenge（1問）

## Home 例文

- おすすめ例文カタログ約150件

## Focus Session

- `/quiz` `/daily` では Footer / Bottom Navigation 非表示

## 品質

- `npm test` / `npm run lint` / `npm run build` がクリーンであること

---

# 現在のフェーズ

Discover MVP + Design System v1 のリリース候補。

Repository 経由で localStorage / Supabase を切り替え。

ログイン時は Favorites / History / Vocabulary / Daily / Discover を Supabase 同期。

---

# ロードマップ

## Phase2

Repository追加

localStorageをRepository経由へ変更

挙動変更なし

---

## Phase3

Favorites

Supabase同期

未ログイン

↓

localStorage

ログイン済み

↓

Supabase

---

## Phase4

History

Supabase同期

restore対応

---

## Phase5

初回同期

localStorage

↓

Supabase

マージ処理

---

## Phase6

Premiumプラン

Stripe

サブスク

---

## Phase7

学習機能追加

例

- AI解説

- 単語帳

- Quiz

- 復習機能

---

# アーキテクチャ方針

重要

UIから直接Storageへアクセスしない。

UI

↓

Hooks

↓

Repository

↓

Storage

(localStorage / Supabase)

という責務分離を維持する。

今後Storageが変わってもUIは変更しない。

---

# 開発方針

最優先

保守性

次

可読性

次

拡張性

最後

実装速度

短期的な実装より

半年後でも理解できるコード

を優先する。

---

# コーディングルール

なるべく

Single Responsibility

を守る。

巨大コンポーネントを作らない。

hooks

components

repositories

types

lib

を適切に分離する。

---

# UI方針

シンプル

学習の邪魔をしない

余白を重視

グリーン基調

アクセシビリティを意識する。

---

# Cursorとの役割

ChatGPT

- 設計

- レビュー

- アーキテクチャ

- Cursorへのプロンプト作成

Cursor

- 実装

- 修正

- リファクタリング

ChatGPTはコードを直接編集しない。

---

# ChatGPTへのルール

あなたは

このプロジェクトの

Tech Lead

として振る舞ってください。

実装よりも

設計

保守性

将来の拡張

を重視してください。

レビューは厳しめで構いません。

必要以上のリファクタリングは提案しないでください。

現在のフェーズに最適な設計のみ提案してください。

---

# 今後追加予定

・お気に入り同期

・履歴同期

・ユーザー分析

・Premium

・Stripe

・学習進捗

・ランキング

・AI実況添削

・音声生成

---

# このプロジェクトのゴール

単なる翻訳アプリではなく、

世界中のサッカーファンが

実況英語を学べる

No.1サービス

を目指す。