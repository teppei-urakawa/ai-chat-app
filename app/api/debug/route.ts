import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { env } from '@/lib/env'

// 本番デバッグ用エンドポイント（原因判明後に削除）
export async function GET() {
  const result: Record<string, string> = {}

  // 1. 環境変数チェック
  result.auth_secret_length = String(env.authSecret.length)
  result.github_id_prefix   = env.githubClientId.substring(0, 5)
  result.db_url_prefix      = env.databaseUrl.substring(0, 35) + '...'
  result.is_prod            = String(env.isProd)
  result.auth_url           = process.env.AUTH_URL ?? 'not set'
  result.nextauth_url       = process.env.NEXTAUTH_URL ?? 'not set'

  // 2. DB接続チェック
  try {
    await db.execute(sql`SELECT 1 as ok`)
    result.db_connection = 'ok'
  } catch (e) {
    result.db_connection = 'error: ' + String(e)
  }

  // 3. usersテーブルへのINSERT（RLSでブロックされていないか確認）
  try {
    await db.execute(sql`
      INSERT INTO users (id, name, email)
      VALUES ('__debug_test__', 'Debug', 'debug@test.com')
      ON CONFLICT (id) DO NOTHING
    `)
    await db.execute(sql`DELETE FROM users WHERE id = '__debug_test__'`)
    result.users_rls = 'ok (insert+delete succeeded)'
  } catch (e) {
    result.users_rls = 'error: ' + String(e)
  }

  return Response.json(result, { status: 200 })
}
