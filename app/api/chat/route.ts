import { streamText, convertToModelMessages } from 'ai'
import { google } from '@ai-sdk/google'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { conversations, messages } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const uiMessages = body.messages ?? []
  const conversationId: string | undefined = body.conversationId
  const userId = session.user.id

  // 会話の存在確認
  if (conversationId) {
    const conv = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    })
    if (!conv) {
      return new Response('Not found', { status: 404 })
    }
  }

  // ユーザーメッセージをDBに保存
  const lastMsg = uiMessages[uiMessages.length - 1]
  if (conversationId && lastMsg?.role === 'user') {
    const textPart = lastMsg.parts?.find((p: { type: string }) => p.type === 'text')
    const content = textPart?.text ?? ''
    if (content) {
      await db.insert(messages).values({ conversationId, role: 'user', content })
    }
  }

  const result = streamText({
    model: google('gemini-1.5-flash'),
    messages: await convertToModelMessages(uiMessages),
    onFinish: async ({ text }) => {
      if (conversationId) {
        await db.insert(messages).values({
          conversationId,
          role: 'assistant',
          content: text,
        })
        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId))
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
