import { sql } from 'drizzle-orm'
import { db, type Tx } from './index'

/**
 * RLS ユーザーコンテキスト付き DB クエリ実行ヘルパー
 *
 * RLS ポリシーが参照する `app.current_user_id` をトランザクション内でのみ
 * 有効な形でセットしてからクエリを実行する。
 * `is_local = true` によりトランザクション終了後は自動でリセットされる。
 *
 * 使い方:
 *   const list = await withUser(userId, tx => tx.query.conversations.findMany(...))
 */
export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`)
    return fn(tx) // Tx 型が正確に推論されるためキャスト不要
  })
}
