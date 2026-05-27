'use client'

import { useEffect, useCallback } from 'react'

/** サイドバー更新イベントの名前を一箇所で管理する */
const SIDEBAR_REFRESH_EVENT = 'conversation-updated'

/**
 * サイドバーの更新を通知する関数を返すフック。
 * 送信側（チャットページ）で使用する。
 */
export function useNotifySidebarRefresh(): () => void {
  return useCallback(() => {
    window.dispatchEvent(new Event(SIDEBAR_REFRESH_EVENT))
  }, [])
}

/**
 * サイドバー更新イベントを受け取るフック。
 * 受信側（ChatSidebar）で使用する。
 */
export function useSidebarRefreshListener(onRefresh: () => void): void {
  useEffect(() => {
    window.addEventListener(SIDEBAR_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(SIDEBAR_REFRESH_EVENT, onRefresh)
  }, [onRefresh])
}
