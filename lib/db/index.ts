import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'
import { env } from '@/lib/env'

/**
 * データベース接続
 *
 * 【セキュリティ上の注意】
 * DATABASE_URL には Supabase の管理者権限が含まれています。
 * この接続はアプリサーバーのみが使用し、クライアント（ブラウザ）
 * には絶対に渡してはいけません。
 *
 * 追加の防御策として supabase/rls.sql でRLSポリシーを設定しています。
 * RLSとは: コードのバグがあっても「自分のデータしか触れない」を
 *           データベースレベルで強制する仕組みです。
 */
const client = postgres(env.databaseUrl, {
  max: 1, // サーバーレス環境では接続を最小限に
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
})

export const db = drizzle(client, { schema })

// トランザクション型をここで一元定義する
// db.transaction コールバックの引数型を直接推論するため、常に実装と同期する
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
