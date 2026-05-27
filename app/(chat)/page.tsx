'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { useRef, useEffect, useState, type FormEvent } from 'react'

export default function HomePage() {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

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
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              AI チャット
            </h2>
            <p className="text-gray-400 text-sm">
              メッセージを送信して会話を始めましょう
            </p>
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
