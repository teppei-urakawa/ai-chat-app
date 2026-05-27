import { streamText, convertToModelMessages } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { auth } from '@/lib/auth'
import { conversationRepository, messageRepository } from '@/lib/chat/repository'
import { generateConversationTitle } from '@/lib/chat/service'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

const groq = createGroq({ apiKey: env.groqApiKey })

export async function POST(req: Request) {
  // 認証チェック（第1防衛線）
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { messages: uiMessages = [], conversationId } = await req.json()
  const userId = session.user.id

  // 会話の存在確認と初回判定
  let isFirstMessage = false
  if (conversationId) {
    const conv = await conversationRepository.findById(userId, conversationId)
    if (!conv) return new Response('Not found', { status: 404 })
    isFirstMessage = conv.title === 'New Chat'
  }

  // ユーザーメッセージのテキストを抽出
  const lastMsg = uiMessages.at(-1)
  const userText: string =
    lastMsg?.parts?.find((p: { type: string }) => p.type === 'text')?.text ?? ''

  if (conversationId && lastMsg?.role === 'user' && userText) {
    await messageRepository.append(userId, conversationId, 'user', userText)
  }

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages: await convertToModelMessages(uiMessages),
    onFinish: async ({ text }) => {
      if (!conversationId) return
      await messageRepository.append(userId, conversationId, 'assistant', text)
      if (isFirstMessage && userText) {
        const title = await generateConversationTitle(userText, text)
        await conversationRepository.updateTitle(userId, conversationId, title)
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
