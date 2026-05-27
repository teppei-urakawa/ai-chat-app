'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { modes, accents, type ThemeMode, type AccentColor } from '@/lib/themes'

export function ThemeSelector() {
  const { theme, setMode, setAccent } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 外側クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* トリガーボタン */}
      <button
        onClick={() => setOpen(v => !v)}
        title="外観設定"
        style={{
          width: '100%', padding: '8px 12px',
          background: open ? 'var(--surface-2)' : 'none',
          border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--text-muted)', fontSize: 13,
          cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'all 0.15s',
          marginBottom: 8,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--text)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }
        }}
      >
        <span style={{ fontSize: 15 }}>🎨</span>
        外観設定
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* パネル */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '110%', left: 0, right: 0,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 14, padding: '16px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          zIndex: 50,
        }}>
          {/* モード選択 */}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            テーマ
          </p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {(Object.keys(modes) as ThemeMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                style={{
                  flex: 1, padding: '7px 4px', fontSize: 12, fontWeight: 500,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  border: theme.mode === mode
                    ? '1.5px solid var(--accent)'
                    : '1.5px solid var(--border)',
                  background: theme.mode === mode
                    ? 'var(--accent-grad)'
                    : 'var(--surface)',
                  color: theme.mode === mode ? '#fff' : 'var(--text-muted)',
                }}
              >
                {modes[mode].label}
              </button>
            ))}
          </div>

          {/* アクセントカラー */}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            アクセントカラー
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(Object.keys(accents) as AccentColor[]).map(accent => {
              const a = accents[accent]
              const isActive = theme.accent === accent
              return (
                <button
                  key={accent}
                  onClick={() => setAccent(accent)}
                  title={a.label}
                  style={{
                    flex: 1, height: 32, borderRadius: 8, cursor: 'pointer',
                    background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
                    border: isActive ? '2.5px solid white' : '2.5px solid transparent',
                    outline: isActive ? `2px solid ${a.from}` : 'none',
                    outlineOffset: 1,
                    transition: 'all 0.15s',
                    boxShadow: isActive ? `0 0 12px ${a.shadow}` : 'none',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
