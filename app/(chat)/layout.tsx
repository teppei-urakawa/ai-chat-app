import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { SessionProvider } from 'next-auth/react'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen overflow-hidden">
        <ChatSidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SessionProvider>
  )
}
