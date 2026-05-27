'use client'

import { type FormEvent, useRef, useEffect } from 'react'

type Props = {
  input: string
  isLoading: boolean
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // IME（日本語変換など）で変換中かどうかを追跡する
  // compositionstart/compositionend で更新し、Enter キー押下時に参照する
  const isComposingRef = useRef(false)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // IME変換中（例：かな→漢字の確定Enter）は送信しない
      if (isComposingRef.current) return
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as FormEvent<HTMLFormElement>)
      }
    }
  }

  return (
    <div style={{
      padding: '16px 20px 20px',
      background: 'var(--bg)',
      borderTop: '1px solid var(--border)',
    }}>
      <form
        onSubmit={onSubmit}
        style={{
          maxWidth: 760, margin: '0 auto',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 10,
          boxShadow: '0 0 0 1px rgba(124,92,252,0.0)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={e => {
          const form = e.currentTarget
          form.style.borderColor = 'rgba(124,92,252,0.5)'
          form.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)'
        }}
        onBlur={e => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            const form = e.currentTarget
            form.style.borderColor = 'var(--border)'
            form.style.boxShadow = '0 0 0 1px rgba(124,92,252,0.0)'
          }
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { isComposingRef.current = true }}
          onCompositionEnd={() => { isComposingRef.current = false }}
          placeholder="メッセージを入力…"
          rows={1}
          disabled={isLoading}
          style={{
            flex: 1, resize: 'none',
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 14, lineHeight: 1.6,
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Enter で送信 · Shift+Enter で改行
          </span>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            style={{
              padding: '7px 16px',
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, #7c5cfc, #4fa3f7)'
                : 'var(--surface-2)',
              border: 'none', borderRadius: 10,
              color: input.trim() && !isLoading ? '#fff' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {isLoading ? (
              <>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff',
                  animation: 'spin 0.7s linear infinite',
                  display: 'inline-block',
                }} />
                生成中
              </>
            ) : '送信 ↑'}
          </button>
        </div>
      </form>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
        Groq · Llama 3.3 70B
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
