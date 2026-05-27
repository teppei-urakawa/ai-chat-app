'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

type Props = { message: UIMessage }

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('')
}

/** ユーザーメッセージ（グラデーションバブル） */
function UserMessage({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, padding: '0 16px' }}>
      <div style={{
        maxWidth: '72%',
        background: 'linear-gradient(135deg, #7c5cfc, #4fa3f7)',
        borderRadius: '18px 18px 4px 18px',
        padding: '11px 16px',
        color: '#fff',
        fontSize: 14,
        lineHeight: 1.6,
        boxShadow: '0 4px 20px rgba(124,92,252,0.25)',
      }}>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text}</p>
      </div>
    </div>
  )
}

/** AIメッセージ（コピーボタン付き） */
function AiMessage({ text }: { text: string }) {
  const { isCopied, copy } = useCopyToClipboard()

  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-start',
      marginBottom: 16, padding: '0 16px',
      gap: 10, alignItems: 'flex-start',
    }}>
      {/* AIアバター */}
      <div style={{
        width: 30, height: 30, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #7c5cfc, #4fa3f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#fff', marginTop: 2,
        boxShadow: '0 2px 8px rgba(124,92,252,0.3)',
      }}>AI</div>

      {/* メッセージ本体 */}
      <div style={{ maxWidth: '72%', position: 'relative' }} className="ai-message-wrap">
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px 18px 18px 18px',
          padding: '11px 16px',
          color: 'var(--text)',
          fontSize: 14,
        }}>
          <div className="prose-ai">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        </div>

        {/* コピーボタン（ホバー時に表示） */}
        <button
          onClick={() => copy(text)}
          aria-label={isCopied ? 'コピーしました' : 'コピー'}
          className="copy-btn"
          style={{
            position: 'absolute',
            bottom: -28,
            right: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            background: isCopied ? 'rgba(16,185,129,0.15)' : 'var(--surface-2)',
            border: `1px solid ${isCopied ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
            borderRadius: 20,
            color: isCopied ? '#10b981' : 'var(--text-muted)',
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: 0,           // .ai-message-wrap:hover で表示（CSS）
            whiteSpace: 'nowrap',
          }}
        >
          {isCopied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              コピーしました
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="1" y="3" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="var(--surface-2)"/>
              </svg>
              コピー
            </>
          )}
        </button>
      </div>

      {/* コピーボタンのホバー表示CSS */}
      <style>{`
        .ai-message-wrap:hover .copy-btn { opacity: 1 !important; }
        .copy-btn:hover { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

export function ChatMessage({ message }: Props) {
  const text = getTextContent(message)
  return message.role === 'user'
    ? <UserMessage text={text} />
    : <AiMessage text={text} />
}
