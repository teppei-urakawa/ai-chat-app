/**
 * 環境変数の一元管理・検証
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 【なぜ環境変数の管理が重要なのか】
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 環境変数とは「アプリが使う秘密の鍵」です。
 * これらが GitHub などに流出すると…
 *
 * ❌ GROQ_API_KEY が流出
 *    → 攻撃者がタダでAIを使い放題。あなたの無料枠が即座に消える。
 *
 * ❌ DATABASE_URL が流出
 *    → 全ユーザーのチャット履歴を自由に読み書きできる。
 *      削除も可能。完全なデータ漏洩。
 *
 * ❌ AUTH_SECRET が流出
 *    → セッショントークンを偽造できる。
 *      誰でも他人としてログインできてしまう。
 *
 * ❌ AUTH_GITHUB_SECRET が流出
 *    → GitHub OAuthを悪用し、他人のアカウントで認証できる。
 *
 * 【このファイルの役割】
 * - 全環境変数を一箇所で管理（散在させない）
 * - アプリ起動時に未設定の変数を即座に検出してエラー
 * - TypeScriptの型として扱えるのでtypoも防げる
 */

/**
 * 必須環境変数を取得する。
 * 未設定の場合はわかりやすいエラーメッセージで即座に落とす。
 */
function requireEnv(name: string, description: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    // サーバー起動時にすぐ気づけるよう、詳細なエラーを出す
    throw new Error(
      `\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔑 環境変数エラー: ${name} が未設定です\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `用途: ${description}\n` +
      `対処: .env.local に ${name}=xxx を追記してください\n`
    )
  }
  return value.trim()
}

export const env = {
  /**
   * Groq API キー
   * 流出リスク: 無断でAI APIを使われ無料枠が消費される
   * 取得先: https://console.groq.com → API Keys
   */
  groqApiKey: requireEnv(
    'GROQ_API_KEY',
    'GroqのAI APIを呼び出すための認証キー'
  ),

  /**
   * Auth.js シークレット
   * 流出リスク: セッショントークンを偽造され任意のユーザーになりすまされる
   * 生成: openssl rand -base64 32
   */
  authSecret: requireEnv(
    'AUTH_SECRET',
    'ログインセッションの署名・暗号化に使うシークレット'
  ),

  /**
   * GitHub OAuth クライアントID（公開情報なのでリスクは低め）
   */
  githubClientId: requireEnv(
    'AUTH_GITHUB_ID',
    'GitHub OAuthアプリのクライアントID'
  ),

  /**
   * GitHub OAuth クライアントシークレット
   * 流出リスク: GitHub OAuthを悪用した認証バイパスが可能になる
   */
  githubClientSecret: requireEnv(
    'AUTH_GITHUB_SECRET',
    'GitHub OAuthアプリのクライアントシークレット'
  ),

  /**
   * データベース接続URL
   * 流出リスク: 全テーブルへの完全な読み書きアクセスが可能になる
   * ※ SupabaseはRLS（行レベルセキュリティ）で追加防衛している
   *    詳細: supabase/rls.sql を参照
   */
  databaseUrl: requireEnv(
    'DATABASE_URL',
    'PostgreSQL（Supabase）への接続文字列'
  ),

  /** 本番環境かどうか */
  isProd: process.env.NODE_ENV === 'production',
} as const

// 型エクスポート（型安全に使いたい場合）
export type Env = typeof env
