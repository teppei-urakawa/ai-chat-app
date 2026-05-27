'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useRef, useEffect, useState, useCallback, type FormEvent, type RefObject } from 'react'

interface Options {
  conversationId?: string
  /** ストリーミング完了後に呼ばれるコールバック */
  onStreamComplete?: () => void
}

export interface UseChatSessionReturn {
  messages: UIMessage[]
  input: string
  setInput: (v: string) => void
  isLoading: boolean
  bottomRef: RefObject<HTMLDivElement | null>
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
}

/**
 * チャット画面の共通ロジックをカプセル化するフック
 *
 * page.tsx と [chatId]/page.tsx の両方で使用する。
 * conversationId がある場合は DB から既存メッセージを読み込む。
 *
 * なぜフックに切り出すか:
 * - 2つのページで同じロジックが重複しているため
 * - フックにすることでページコンポーネントが「表示」だけに集中できる
 * - テスト時にフック単体を検証できる
 */
export function useChatSession({
  conversationId,
  onStreamComplete,
}: Options = {}): UseChatSessionReturn {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: conversationId ? { conversationId } : undefined,
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // conversationId がある場合のみ DB から既存メッセージを読み込む
  useEffect(() => {
    if (!conversationId) return
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: { id: string; role: 'user' | 'assistant'; content: string }[] | null) => {
        if (!data) return
        setMessages(
          data.map(m => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text' as const, text: m.content }],
            metadata: undefined,
          }))
        )
      })
  }, [conversationId, setMessages])

  // ストリーミング完了を検知してコールバックを呼ぶ
  const prevStatus = useRef(status)
  useEffect(() => {
    const wasStreaming = prevStatus.current === 'streaming'
    const nowDone = status !== 'streaming' && status !== 'submitted'
    if (wasStreaming && nowDone) {
      // タイトル生成はサーバー側で非同期に行われるため少し待ってから通知
      setTimeout(() => onStreamComplete?.(), 500)
    }
    prevStatus.current = status
  }, [status, onStreamComplete])

  // 新しいメッセージが来たら最下部へスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      sendMessage({ text: input })
      setInput('')
    },
    [input, isLoading, sendMessage]
  )

  return { messages, input, setInput, isLoading, bottomRef, handleSubmit }
}
