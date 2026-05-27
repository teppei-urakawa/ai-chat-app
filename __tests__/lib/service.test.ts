import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock はファイル先頭にホイストされる。
// factory 内で変数を参照するには vi.hoisted で先に宣言しなければならない。
const { mockGenerateText } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
}))

// 環境変数のモック
vi.mock('@/lib/env', () => ({
  env: { groqApiKey: 'test-gsk_key' },
}))

// AI SDK のモック
vi.mock('ai', () => ({ generateText: mockGenerateText }))

// Groq クライアントのモック
vi.mock('@ai-sdk/groq', () => ({
  createGroq: () => (modelId: string) => `mock-model:${modelId}`,
}))

import { generateConversationTitle } from '@/lib/chat/service'

describe('generateConversationTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── happy path ──────────────────────────────

  it('AIが返したテキストをそのままタイトルとして返す', async () => {
    mockGenerateText.mockResolvedValue({ text: 'TypeScriptの型エラーの解決方法' })

    const title = await generateConversationTitle(
      'TypeScriptでエラーが出ます',
      'エラーを解決するには...',
    )

    expect(title).toBe('TypeScriptの型エラーの解決方法')
  })

  it('前後の引用符（「」『』""\'\'）を除去する', async () => {
    const cases = [
      ['「JavaScriptの基礎」', 'JavaScriptの基礎'],
      ['『AIの仕組み』', 'AIの仕組み'],
      ['"Python入門"', 'Python入門'],
    ]

    for (const [raw, expected] of cases) {
      mockGenerateText.mockResolvedValue({ text: raw })
      const title = await generateConversationTitle('質問', '回答')
      expect(title).toBe(expected)
    }
  })

  it('前後のスペースをトリムする', async () => {
    mockGenerateText.mockResolvedValue({ text: '  Reactのフック  ' })

    const title = await generateConversationTitle('フックとは', '説明...')
    expect(title).toBe('Reactのフック')
  })

  it('空文字が返った場合は "New Chat" にフォールバック', async () => {
    mockGenerateText.mockResolvedValue({ text: '' })

    const title = await generateConversationTitle('質問', '回答')
    expect(title).toBe('New Chat')
  })

  it('スペースのみが返った場合は "New Chat" にフォールバック', async () => {
    mockGenerateText.mockResolvedValue({ text: '   ' })

    const title = await generateConversationTitle('質問', '回答')
    expect(title).toBe('New Chat')
  })

  // ─── error case ──────────────────────────────

  it('API呼び出しが失敗しても "New Chat" を返す（例外を投げない）', async () => {
    mockGenerateText.mockRejectedValue(new Error('Network error'))

    const title = await generateConversationTitle('質問', '回答')
    expect(title).toBe('New Chat')
  })

  it('APIがタイムアウトしても "New Chat" を返す', async () => {
    mockGenerateText.mockRejectedValue(new Error('Request timeout'))

    const title = await generateConversationTitle('質問', '回答')
    expect(title).toBe('New Chat')
  })

  // ─── prompt generation ───────────────────────

  it('generateText が正しい引数で呼ばれる', async () => {
    mockGenerateText.mockResolvedValue({ text: 'テストタイトル' })

    await generateConversationTitle('ユーザーの質問', 'AIの回答')

    expect(mockGenerateText).toHaveBeenCalledOnce()
    const callArg = mockGenerateText.mock.calls[0][0]

    // maxOutputTokens が設定されている（長いタイトルを防ぐ）
    expect(callArg.maxOutputTokens).toBe(40)

    // メッセージにユーザーの質問と回答が含まれている
    const prompt = callArg.messages[0].content as string
    expect(prompt).toContain('ユーザーの質問')
    expect(prompt).toContain('AIの回答')
  })

  it('ユーザーメッセージが長い場合は先頭300文字に切り詰める', async () => {
    mockGenerateText.mockResolvedValue({ text: 'タイトル' })

    const longMessage = 'あ'.repeat(500)
    await generateConversationTitle(longMessage, '短い回答')

    const callArg = mockGenerateText.mock.calls[0][0]
    const prompt = callArg.messages[0].content as string

    // 300文字のあ + それ以降が含まれていないことを確認
    expect(prompt).toContain('あ'.repeat(300))
    expect(prompt).not.toContain('あ'.repeat(301))
  })
})
