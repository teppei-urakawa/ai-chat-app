'use client'

import { useState, useCallback, useRef } from 'react'

interface UseCopyToClipboardReturn {
  isCopied: boolean
  copy: (text: string) => Promise<void>
}

/**
 * クリップボードコピーフック
 *
 * なぜフックに分離するか:
 * - テスト時に navigator.clipboard をモックしやすくする
 * - 複数コンポーネントで再利用できる
 * - タイマーのクリーンアップをフック内で責任を持つ
 */
export function useCopyToClipboard(
  resetDelay = 2000
): UseCopyToClipboardReturn {
  const [isCopied, setIsCopied] = useState(false)
  // アンマウント後の setState を防ぐためタイマーIDを保持
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = useCallback(async (text: string) => {
    // Clipboard API が使えない環境（古いブラウザ・HTTP）はスキップ
    if (!navigator.clipboard) return

    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)

      // 前のタイマーをクリアしてからセット（連打対策）
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setIsCopied(false)
        timerRef.current = null
      }, resetDelay)
    } catch {
      // コピー失敗は静かに無視（UXを壊さない）
      setIsCopied(false)
    }
  }, [resetDelay])

  return { isCopied, copy }
}
