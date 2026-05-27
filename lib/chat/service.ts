/**
 * チャット機能のサービス層
 *
 * ビジネスロジックはここに書く。DB操作はリポジトリ、HTTP処理はルートの責務。
 * このファイルは「何をするか」だけを知り、「どこに保存するか」は知らない。
 */
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { env } from '@/lib/env'

const groq = createGroq({ apiKey: env.groqApiKey })

const TITLE_PROMPT = (userMessage: string, aiResponse: string) =>
  '以下の会話の内容を表す短いタイトルを日本語で生成してください。\n' +
  '- 20文字以内\n' +
  '- タイトルのみ返答（かぎかっこ・引用符・説明文は不要）\n\n' +
  `ユーザー: ${userMessage.slice(0, 300)}\n` +
  `AI: ${aiResponse.slice(0, 300)}`

/**
 * 会話の最初のやり取りからタイトルを生成する。
 * 生成に失敗しても例外を投げず 'New Chat' を返す（会話自体を壊さないため）。
 */
export async function generateConversationTitle(
  userMessage: string,
  aiResponse: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'), // タイトル生成には軽量モデルで十分
      messages: [{ role: 'user', content: TITLE_PROMPT(userMessage, aiResponse) }],
      maxOutputTokens: 40,
    })
    return text.trim().replace(/^[「『"']|[」』"']$/g, '') || 'New Chat'
  } catch {
    return 'New Chat'
  }
}
