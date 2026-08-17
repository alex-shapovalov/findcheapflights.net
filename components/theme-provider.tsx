'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { applyTheme, parseTheme, type Theme } from '@/lib/theme'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
} | null>(null)

function themeFromDocument(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return parseTheme(
    document.documentElement.classList.contains('light') ? 'light' : 'dark',
  )
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useLayoutEffect(() => {
    setTheme(themeFromDocument())
  }, [])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
