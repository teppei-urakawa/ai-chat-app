'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ThemeSelector } from '@/components/ThemeSelector'
import { useSidebarRefreshListener } from '@/hooks/useSidebarEvents'

type Conversation = { id: string; title: string; updatedAt: string }

export function ChatSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const router = useRouter()
  const pathname = usePathname()

  // useCallback でメモ化しないと useSidebarRefreshListener の useEffect が毎回再登録される
  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/conversations')
    if (res.ok) setConversations(await res.json())
  }, [])

  // ページ遷移・ストリーミング完了の両方で更新（フックに委譲）
  useSidebarRefreshListener(fetchConversations)

  // pathname 変化でも更新（useEffect の代わりに useSidebarRefreshListener と分離）
  // Note: pathname 変化は router.push 時に発生するため別途監視が必要
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    fetchConversations()
  }

  const handleNew = async () => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chat' }),
    })
    if (res.ok) router.push(`/${(await res.json()).id}`)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    if (pathname === `/${id}`) router.push('/')
    fetchConversations()
  }

  return (
    <aside style={{
      width: 260, height: '100%', flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
    }}>
      {/* ヘッダー（ロゴ + 新規チャット） */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: 'var(--accent-grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
          }}>A</div>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>AI Chat</span>
        </div>
        <button
          onClick={handleNew}
          style={{
            width: '100%', padding: '9px 14px', border: 'none', borderRadius: 10,
            background: 'var(--accent-grad)', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          新規チャット
        </button>
      </div>

      {/* 会話一覧 */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {conversations.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            チャット履歴なし
          </p>
        )}
        {conversations.map(conv => {
          const isActive = pathname === `/${conv.id}`
          return (
            <Link
              key={conv.id}
              href={`/${conv.id}`}
              className="sidebar-link"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                background: isActive ? 'var(--surface-2)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13, textDecoration: 'none', transition: 'all 0.15s',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {conv.title}
              </span>
              <button
                onClick={e => handleDelete(conv.id, e)}
                className="delete-btn"
                style={{
                  marginLeft: 8, background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: 12, padding: '2px 4px', borderRadius: 4,
                  opacity: 0, transition: 'opacity 0.15s',
                }}
              >✕</button>
            </Link>
          )
        })}
      </nav>

      {/* フッター（外観設定 + ログアウト） */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <ThemeSelector />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            width: '100%', padding: '8px 12px', background: 'none',
            border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text-muted)', fontSize: 13,
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--text)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >↩ ログアウト</button>
      </div>

      <style>{`
        .sidebar-link:hover { background: var(--surface-2) !important; color: var(--text) !important; }
        .sidebar-link:hover .delete-btn { opacity: 1 !important; }
      `}</style>
    </aside>
  )
}
