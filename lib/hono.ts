import { Hono } from 'hono'
import { auth } from './auth'
import { conversationRepository, messageRepository } from './chat/repository'

type Env = { Variables: { userId: string } }

const app = new Hono<Env>().basePath('/api')

// 認証ミドルウェア（第1防衛線）
app.use('*', async (c, next) => {
  const session = await auth()
  if (!session?.user?.id) return c.json({ error: 'Unauthorized' }, 401)
  c.set('userId', session.user.id)
  await next()
})

app.get('/conversations', async (c) => {
  const list = await conversationRepository.findAll(c.get('userId'))
  return c.json(list)
})

app.post('/conversations', async (c) => {
  const { title } = await c.req.json().catch(() => ({ title: 'New Chat' }))
  const conv = await conversationRepository.create(c.get('userId'), title || 'New Chat')
  return c.json(conv, 201)
})

app.patch('/conversations/:id', async (c) => {
  const { title } = await c.req.json()
  const conv = await conversationRepository.updateTitle(c.get('userId'), c.req.param('id'), title)
  if (!conv) return c.json({ error: 'Not found' }, 404)
  return c.json(conv)
})

app.delete('/conversations/:id', async (c) => {
  await conversationRepository.remove(c.get('userId'), c.req.param('id'))
  return c.body(null, 204)
})

app.get('/conversations/:id/messages', async (c) => {
  const msgs = await messageRepository.findByConversation(c.get('userId'), c.req.param('id'))
  if (!msgs) return c.json({ error: 'Not found' }, 404)
  return c.json(msgs)
})

export default app
