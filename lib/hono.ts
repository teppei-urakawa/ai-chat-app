import { Hono } from 'hono'
import { auth } from './auth'
import { db } from './db'
import { conversations, messages } from './db/schema'
import { eq, and, asc } from 'drizzle-orm'

// Honoコンテキストの型定義
type Env = {
  Variables: {
    userId: string
  }
}

const app = new Hono<Env>().basePath('/api')

// 認証ミドルウェア
app.use('*', async (c, next) => {
  const session = await auth()
  if (!session?.user?.id) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('userId', session.user.id)
  await next()
})

// 会話一覧取得
app.get('/conversations', async (c) => {
  const userId = c.get('userId')
  const list = await db.query.conversations.findMany({
    where: eq(conversations.userId, userId),
    orderBy: (t, { desc }) => [desc(t.updatedAt)],
  })
  return c.json(list)
})

// 新規会話作成
app.post('/conversations', async (c) => {
  const userId = c.get('userId')
  const { title } = await c.req.json().catch(() => ({ title: 'New Chat' }))
  const [conv] = await db
    .insert(conversations)
    .values({ userId, title: title || 'New Chat' })
    .returning()
  return c.json(conv, 201)
})

// 会話のタイトル更新
app.patch('/conversations/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()
  const { title } = await c.req.json()
  const [conv] = await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .returning()
  if (!conv) return c.json({ error: 'Not found' }, 404)
  return c.json(conv)
})

// 会話削除
app.delete('/conversations/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()
  await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
  return c.body(null, 204)
})

// メッセージ一覧取得
app.get('/conversations/:id/messages', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()
  const conv = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
  })
  if (!conv) return c.json({ error: 'Not found' }, 404)
  const msgs = await db.query.messages.findMany({
    where: eq(messages.conversationId, id),
    orderBy: [asc(messages.createdAt)],
  })
  return c.json(msgs)
})

export default app
