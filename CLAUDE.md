# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # 開発サーバー起動（通常 localhost:3000）
npm run build    # 本番ビルド
npm run lint     # ESLint

# DBスキーマをSupabaseへ即時反映（マイグレーションファイルなし）
npx drizzle-kit push

# マイグレーションSQLを生成するだけ（適用しない）
npx drizzle-kit generate
```

## Architecture

### 全体像

Next.js 16 App Router の完全スタック構成。AI はストリーミング、API は Hono、DB は Drizzle ORM (PostgreSQL)、認証は Auth.js v5。

### ルーティング

| パス | 役割 |
|------|------|
| `app/(auth)/login/` | ログインページ（未認証時にリダイレクト） |
| `app/(chat)/` | チャット UI（layout でセッション確認） |
| `app/(chat)/[chatId]/` | 特定会話のチャット画面 |
| `app/api/chat/` | AI ストリーミングエンドポイント（Vercel AI SDK） |
| `app/api/[[...route]]/` | Hono が処理する REST API（会話 CRUD） |
| `app/api/auth/[...nextauth]/` | Auth.js ハンドラー |

### AI ストリーミング（`app/api/chat/route.ts`）

`@ai-sdk/groq` + `ai` パッケージで Groq の `llama-3.3-70b-versatile` をストリーミング。`convertToModelMessages` で UI メッセージ形式を変換してから `streamText` に渡す。クライアントは `@ai-sdk/react` の `useChat` + `DefaultChatTransport` で受信。

### REST API（`lib/hono.ts`）

Hono アプリを `app/api/[[...route]]/route.ts` でラップしてエクスポート。全ルートに認証ミドルウェアを適用し、`userId` をコンテキストに保持。エンドポイント：
- `GET/POST /api/conversations` — 会話一覧・作成
- `PATCH/DELETE /api/conversations/:id` — 更新・削除
- `GET /api/conversations/:id/messages` — メッセージ一覧

### DB（`lib/db/`）

`drizzle-orm/postgres-js` で Supabase に接続。スキーマは `lib/db/schema.ts` に一元管理。Auth.js 用テーブル（users / accounts / sessions / verificationTokens）とアプリ用テーブル（conversations / messages）が共存。`drizzle-kit push` でスキーマを直接適用（マイグレーションファイルは使わない運用）。

### 認証（`lib/auth.ts`）

Auth.js v5（`next-auth@beta`）+ GitHub OAuth + DrizzleAdapter。`auth()` は Server Component / Route Handler 両方から呼び出せる。クライアント側では `SessionProvider` 経由で `useSession()` を使用。

### テーマシステム

- **`lib/themes.ts`** — モード（dark/light/midnight）とアクセントカラー（purple/blue/green/rose）の定義と CSS 変数適用関数
- **`components/ThemeProvider.tsx`** — Context + localStorage 永続化
- **`app/layout.tsx`** — フラッシュ防止のインラインスクリプト（hydration 前に CSS 変数を適用）。`<html>` に `suppressHydrationWarning` が必要
- UI は CSS カスタムプロパティ（`var(--bg)`, `var(--accent-grad)` 等）を直接インラインスタイルで使用

### パスエイリアス

`@/*` → リポジトリルート（例：`@/lib/auth`, `@/components/ThemeProvider`）

## Environment Variables

`.env.local` に以下が必要：

```
GROQ_API_KEY=gsk_...          # console.groq.com で発行（gsk_ 始まり）
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_SECRET=...                # openssl rand -base64 32 で生成
DATABASE_URL=postgresql://...  # Supabase の直接接続 URL（ポート 5432）
NEXTAUTH_URL=http://localhost:3000
```

`drizzle-kit push` は `@next/env` の `loadEnvConfig` で `.env.local` を読み込む。Supabase の pooler URL（ポート 6543）はマイグレーション時に使用不可。

## Testing

```bash
npm test               # 全テストを1回実行
npm run test:watch     # ウォッチモード（開発中）
npm run test:coverage  # カバレッジ付き実行
```

**テストフレームワーク:** Vitest + Testing Library + jsdom  
**設定ファイル:** `vitest.config.ts`, `vitest.setup.ts`  
**テストファイルの置き場所:** `__tests__/` ディレクトリ（ファイル名は `*.test.ts` または `*.test.tsx`）

### モックの基本パターン

```typescript
// DBのモック
vi.mock('@/lib/db', () => ({ db: { query: { ... } } }))

// 環境変数のモック
vi.mock('@/lib/env', () => ({ env: { groqApiKey: 'test-key', ... } }))

// withUserのモック（RLSラッパーを透過させる）
vi.mock('@/lib/db/with-user', () => ({
  withUser: (_userId: string, fn: (tx: unknown) => unknown) => fn({} as unknown),
}))
```

## 設計・実装の鉄則

新しい機能を追加するときは **必ずこの順番** で進める。順序を守らないと後でテストが書けない設計になる。

```
1. 責務を一文で定義する
2. インターフェース（入力・出力・副作用）を決める
3. エラーケースを全列挙する
4. 依存関係を整理してモック可能な設計にする
5. テストケース表を書く（コードを書く前）
6. 実装する
7. テストを書く
8. レビューループ（tsc + npm test が全部通るまで）
```

### コードの掟（レビューで必ずチェックされる）

| ルール | 理由 |
|--------|------|
| `any` 禁止 | 型エラーが実行時まで気づけなくなる |
| 1関数1責務 | テストが書きにくくなる・変更影響が広がる |
| 依存は引数か env 経由 | ハードコードするとモックできない |
| エラーは早期リターン | ネストが深くなり読みにくくなる |
| コメントは「なぜ」 | 「何を」はコードが語る |

### DB クエリの必須ルール

- DB クエリは必ず `withUser(userId, tx => ...)` でラップする（RLS 適用のため）
- `process.env` を直接参照しない → `lib/env.ts` の `env.xxx` を使う
- `conversations` / `messages` テーブルの操作には必ず `userId` の所有権チェックを含める

## 自動化コマンド

`/feature <機能の説明>` — 設計→実装→テスト→レビューループを自動で実行するコマンド。
定義: `.claude/commands/feature.md`

フェーズ:
1. 設計（責務・インターフェース・エラーケース・依存関係）
2. 実装（掟に従う）
3. ハーネス設計（テストケース表を先に書く）
4. テスト実装と実行
5. レビューループ（全 ✅ になるまで最大5回）
6. 学習記録を CLAUDE.md に追記

## 学習済みルール

<!-- /feature コマンドが自動追記するセクション -->

### リファクタリング（リポジトリ・サービス・フック分離）— 2026-05-27
- **責務分離の鉄則**: DB操作→`lib/chat/repository.ts`、ビジネスロジック→`lib/chat/service.ts`、UI状態→`hooks/`。ルートハンドラー・Hono に drizzle を直書きしない
- **型の安全な取り扱い**: Drizzle の `InferSelectModel<typeof table>` でスキーマから型を生成。手書きの型定義・`as unknown as` キャストは禁止
- **Tx 型**: `db.transaction` のコールバック引数の型は `Parameters<Parameters<typeof db.transaction>[0]>[0]` で取得して export する
- **イベント駆動のコンポーネント間通信**: コンポーネントを直接結合せず `CustomEvent` を使う（`useSidebarEvents.ts` パターン）
- **useCallback でメモ化**: `useEffect` の依存配列に渡す関数は `useCallback` でメモ化しないと毎回再登録される

### コピーボタン — 2026-05-27
- **発見したパターン**: `navigator.clipboard` などのブラウザAPIはカスタムフック（`hooks/`）に切り出すとモックが簡単になる。コンポーネントから直接呼ぶとテストで困る
- **避けるべきアンチパターン**: `setTimeout` をコンポーネント内に直書きするとアンマウント後の setState が発生する。`useRef` でタイマーIDを保持してクリーンアップする
- **テストの工夫**: `vi.useFakeTimers()` + `vi.advanceTimersByTime()` で非同期タイマーを同期的にテストできる。`renderHook` + `act` でフックの状態変化を確認する

### vi.mock のホイスト問題 — 2026-05-27
- **問題**: `vi.mock('mod', () => ({ fn: mockFn }))` の factory 内で `const mockFn = vi.fn()` を参照すると "Cannot access before initialization" が起きる。`vi.mock` はファイル先頭にホイストされるが `const` は移動しないため
- **解決策**: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))` でモック関数を先に宣言する
- **適用条件**: `vi.mock` factory 内で変数を参照する場合のみ必要。`vi.mock('@/lib/env', () => ({ env: {...} }))` のようにリテラルだけなら不要

