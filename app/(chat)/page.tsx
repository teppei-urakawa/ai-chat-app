'use client'

import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { useChatSession } from '@/hooks/useChatSession'
import type { UIMessage } from 'ai'

const SUGGESTIONS = ['コードを書いて', '文章を要約して', '英語に翻訳して', 'アイデアを出して'] as const

export default function HomePage() {
  const { messages, input, setInput, isLoading, bottomRef, handleSubmit } = useChatSession()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 24, paddingBottom: 8 }}>
        {messages.length === 0 ? (
          <EmptyState onSuggestion={setInput} />
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

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 24px',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, marginBottom: 20,
        background: 'var(--accent-grad)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 700, color: '#fff',
        boxShadow: '0 8px 32px var(--accent-shadow)',
      }}>A</div>

      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
        何でも聞いてください
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, margin: '0 0 24px' }}>
        Llama 3.3 70B がリアルタイムで回答します。<br />
        コード・翻訳・アイデア出し、なんでもどうぞ。
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            style={{
              padding: '8px 14px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 20,
              color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >{s}</button>
        ))}
      </div>
    </div>
  )
}
