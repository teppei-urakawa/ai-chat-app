// テーマ定義

export type ThemeMode = 'dark' | 'light' | 'midnight'
export type AccentColor = 'purple' | 'blue' | 'green' | 'rose'

export interface ThemeConfig {
  mode: ThemeMode
  accent: AccentColor
}

export const DEFAULT_THEME: ThemeConfig = { mode: 'dark', accent: 'purple' }

export const modes: Record<ThemeMode, {
  bg: string; surface: string; surface2: string
  border: string; text: string; textMuted: string
  codeBg: string; preBg: string; label: string
}> = {
  dark: {
    label: 'ダーク',
    bg: '#0d0d10', surface: '#16161a', surface2: '#1e1e24',
    border: 'rgba(255,255,255,0.07)', text: '#e8e8f0', textMuted: '#6b6b80',
    codeBg: 'rgba(255,255,255,0.08)', preBg: 'rgba(0,0,0,0.4)',
  },
  light: {
    label: 'ライト',
    bg: '#f5f5f8', surface: '#ffffff', surface2: '#ebebf0',
    border: 'rgba(0,0,0,0.08)', text: '#1a1a2e', textMuted: '#888899',
    codeBg: 'rgba(0,0,0,0.06)', preBg: 'rgba(0,0,0,0.04)',
  },
  midnight: {
    label: 'ミッドナイト',
    bg: '#000000', surface: '#0a0a0a', surface2: '#111114',
    border: 'rgba(255,255,255,0.05)', text: '#e0e0e8', textMuted: '#555565',
    codeBg: 'rgba(255,255,255,0.06)', preBg: 'rgba(0,0,0,0.6)',
  },
}

export const accents: Record<AccentColor, {
  from: string; to: string; shadow: string; label: string
}> = {
  purple: { label: 'パープル', from: '#7c5cfc', to: '#4fa3f7', shadow: 'rgba(124,92,252,0.3)' },
  blue:   { label: 'ブルー',   from: '#3b82f6', to: '#06b6d4', shadow: 'rgba(59,130,246,0.3)' },
  green:  { label: 'グリーン', from: '#10b981', to: '#34d399', shadow: 'rgba(16,185,129,0.3)' },
  rose:   { label: 'ローズ',   from: '#f43f5e', to: '#fb923c', shadow: 'rgba(244,63,94,0.3)' },
}

// CSS変数をdocument.documentElementに適用する関数
export function applyTheme(config: ThemeConfig) {
  const m = modes[config.mode]
  const a = accents[config.accent]
  const root = document.documentElement

  root.style.setProperty('--bg', m.bg)
  root.style.setProperty('--surface', m.surface)
  root.style.setProperty('--surface-2', m.surface2)
  root.style.setProperty('--border', m.border)
  root.style.setProperty('--text', m.text)
  root.style.setProperty('--text-muted', m.textMuted)
  root.style.setProperty('--code-bg', m.codeBg)
  root.style.setProperty('--pre-bg', m.preBg)
  root.style.setProperty('--accent', a.from)
  root.style.setProperty('--accent-2', a.to)
  root.style.setProperty('--accent-shadow', a.shadow)
  root.style.setProperty('--accent-grad', `linear-gradient(135deg, ${a.from}, ${a.to})`)
}
