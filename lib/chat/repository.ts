/**
 * チャット機能のリポジトリ層
 *
 * ルールとして DB 操作はここにのみ書く。
 * API ルート・Hono ハンドラーに drizzle のメソッドを直書きしない。
 *
 * 理由:
 * - DB 操作を一箇所に集約することでテスト時のモックが簡単になる
 * - ルート/ハンドラーが「何をするか」だけを書けばよくなる
 * - スキーマ変更の影響をここに封じ込められる
 */
import type { InferSelectModel } from 'drizzle-orm'
import { eq, and, asc } from 'drizzle-orm'
import { withUser } from '@/lib/db/with-user'
import { conversations, messages } from '@/lib/db/schema'

// スキーマから型を生成（手書きの型定義を持たない）
export type Conversation = InferSelectModel<typeof conversations>
export type Message = InferSelectModel<typeof messages>

// ─────────────────────────────────────────────────────────────
// 会話リポジトリ
// ─────────────────────────────────────────────────────────────
export const conversationRepository = {
  /** ユーザーの会話一覧を最終更新順で取得 */
  findAll: (userId: string): Promise<Conversation[]> =>
    withUser(userId, tx =>
      tx.query.conversations.findMany({
        where: eq(conversations.userId, userId),
        orderBy: (t, { desc }) => [desc(t.updatedAt)],
      })
    ),

  /** ID で会話を1件取得（所有権チェック込み）。存在しなければ undefined */
  findById: (userId: string, id: string): Promise<Conversation | undefined> =>
    withUser(userId, tx =>
      tx.query.conversations.findFirst({
        where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
      })
    ),

  /** 会話を新規作成して返す */
  create: (userId: string, title: string): Promise<Conversation> =>
    withUser(userId, async tx => {
      const [conv] = await tx
        .insert(conversations)
        .values({ userId, title })
        .returning()
      return conv
    }),

  /** タイトルを更新して返す。見つからなければ null */
  updateTitle: (userId: string, id: string, title: string): Promise<Conversation | null> =>
    withUser(userId, async tx => {
      const [conv] = await tx
        .update(conversations)
        .set({ title, updatedAt: new Date() })
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
        .returning()
      return conv ?? null
    }),

  /** 会話を削除する（メッセージは CASCADE で自動削除） */
  remove: (userId: string, id: string): Promise<void> =>
    withUser(userId, async tx => {
      await tx
        .delete(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    }),
}

// ─────────────────────────────────────────────────────────────
// メッセージリポジトリ
// ─────────────────────────────────────────────────────────────
export const messageRepository = {
  /**
   * 会話のメッセージ一覧を取得。
   * 会話が存在しない（または所有権なし）場合は null。
   */
  findByConversation: (userId: string, conversationId: string): Promise<Message[] | null> =>
    withUser(userId, async tx => {
      const conv = await tx.query.conversations.findFirst({
        where: and(eq(conversations.id, conversationId), eq(conversations.userId, userId)),
      })
      if (!conv) return null
      return tx.query.messages.findMany({
        where: eq(messages.conversationId, conversationId),
        orderBy: [asc(messages.createdAt)],
      })
    }),

  /** メッセージを1件追加する */
  append: (
    userId: string,
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<void> =>
    withUser(userId, async tx => {
      await tx.insert(messages).values({ conversationId, role, content })
      // メッセージ追加のたびに会話の updatedAt を更新する
      await tx
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    }),
}
