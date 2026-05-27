'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

type Conversation = {
  id: string
  title: string
  updatedAt: string
}

export function ChatSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const router = useRouter()
  const pathname = usePathname()

  const fetchConversations = async () => {
    const res = await fetch('/api/conversations')
    if (res.ok) {
      const data = await res.json()
      setConversations(data)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [pathname])

  const handleNew = async () => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chat' }),
    })
    if (res.ok) {
      const conv = await res.json()
      router.push(`/${conv.id}`)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    if (pathname === `/${id}`) router.push('/')
    fetchConversations()
  }

  return (
    <aside className="flex flex-col w-64 h-full bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleNew}
          className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
        >
          + 新規チャット
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {conversations.map((conv) => {
          const isActive = pathname === `/${conv.id}`
          return (
            <Link
              key={conv.id}
              href={`/${conv.id}`}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                isActive ? 'bg-gray-700' : 'hover:bg-gray-800'
              }`}
            >
              <span className="truncate">{conv.title}</span>
              <button
                onClick={(e) => handleDelete(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 ml-2 text-gray-400 hover:text-red-400 transition-opacity"
                title="削除"
              >
                ✕
              </button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full py-2 px-4 text-sm text-gray-400 hover:text-white transition-colors text-left"
        >
          ログアウト
        </button>
      </div>
    </aside>
  )
}
