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

  // 入力内容に応じてtextareaの高さを自動調整
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enterで改行、Enterのみで送信
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as FormEvent<HTMLFormElement>)
      }
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <form onSubmit={onSubmit} className="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力… (Enterで送信、Shift+Enterで改行)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {isLoading ? '…' : '送信'}
        </button>
      </form>
      <p className="text-center text-xs text-gray-400 mt-2">
        Google Gemini 1.5 Flash がメッセージを生成します
      </p>
    </div>
  )
}
