'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useEffect, useRef, use, useState, type FormEvent } from 'react'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'

type Props = {
  params: Promise<{ chatId: string }>
}

export default function ChatPage({ params }: Props) {
  const { chatId } = use(params)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId: chatId },
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // 既存メッセージをDBから読み込む
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/conversations/${chatId}/messages`)
      if (!res.ok) return
      const data: { id: string; role: 'user' | 'assistant'; content: string }[] =
        await res.json()
      const loaded: UIMessage[] = data.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: 'text' as const, text: m.content }],
        metadata: undefined,
      }))
      setMessages(loaded)
    }
    load()
  }, [chatId, setMessages])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-400 text-sm">メッセージを送信して会話を始めましょう</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
