'use client'

import { use } from 'react'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { useChatSession } from '@/hooks/useChatSession'
import { useNotifySidebarRefresh } from '@/hooks/useSidebarEvents'
import type { UIMessage } from 'ai'

type Props = { params: Promise<{ chatId: string }> }

export default function ChatPage({ params }: Props) {
  const { chatId } = use(params)
  const notifyRefresh = useNotifySidebarRefresh()

  const { messages, input, setInput, isLoading, bottomRef, handleSubmit } = useChatSession({
    conversationId: chatId,
    onStreamComplete: notifyRefresh,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 24, paddingBottom: 8 }}>
        {messages.length === 0 ? (
          <EmptyMessage />
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={e => setInput(e.target.value)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function MessageList({ messages }: { messages: UIMessage[] }) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 8 }}>
      {messages.map(m => <ChatMessage key={m.id} message={m} />)}
    </div>
  )
}

function EmptyMessage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>メッセージを送信して会話を始めましょう</p>
    </div>
  )
}
