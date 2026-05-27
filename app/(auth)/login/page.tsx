import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/')

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 背景グロー */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 380, padding: '0 24px',
        position: 'relative', zIndex: 1,
      }}>
        {/* カード */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 24, padding: '40px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          textAlign: 'center',
        }}>
          {/* ロゴ */}
          <div style={{
            width: 56, height: 56, borderRadius: 18, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #7c5cfc, #4fa3f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#fff',
            boxShadow: '0 8px 24px rgba(124,92,252,0.4)',
          }}>A</div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
            AI Chat へようこそ
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 32px' }}>
            GitHubアカウントでログインして<br />会話を始めましょう
          </p>

          <form
            action={async () => {
              'use server'
              await signIn('github', { redirectTo: '/' })
            }}
          >
            <button
              type="submit"
              style={{
                width: '100%', padding: '13px 20px',
                background: '#24292e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 10,
                color: '#fff', fontSize: 14, fontWeight: 600,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#333')}
              onMouseLeave={e => (e.currentTarget.style.background = '#24292e')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHubでログイン
            </button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
            完全無料 · カード登録不要
          </p>
        </div>
      </div>
    </main>
  )
}
