'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  applyTheme, DEFAULT_THEME,
  type ThemeConfig, type ThemeMode, type AccentColor,
} from '@/lib/themes'

interface ThemeContextValue {
  theme: ThemeConfig
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME)

  // 初回: localStorageから読み込んで適用
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const config: ThemeConfig = saved ? JSON.parse(saved) : DEFAULT_THEME
    setTheme(config)
    applyTheme(config)
  }, [])

  const update = (next: ThemeConfig) => {
    setTheme(next)
    applyTheme(next)
    localStorage.setItem('theme', JSON.stringify(next))
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setMode: (mode) => update({ ...theme, mode }),
      setAccent: (accent) => update({ ...theme, accent }),
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
