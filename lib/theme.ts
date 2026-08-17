export const THEME_STORAGE_KEY = 'theme'

export type Theme = 'light' | 'dark'

export const THEME_COLORS = {
  dark: {
    ink: '#071018',
    panel: '#0e1a24',
    panel2: '#132333',
    line: '#234056',
    foam: '#e8eef2',
    mute: '#8aa0b2',
    gold: '#e8b84a',
    teal: '#6fd3c2',
    danger: '#e85d4c',
    go: '#3dcc8a',
    onGold: '#071018',
    backdrop: 'rgba(7, 16, 24, 0.72)',
  },
  light: {
    ink: '#f3f6f9',
    panel: '#ffffff',
    panel2: '#e8eef3',
    line: '#c5d4df',
    foam: '#10202c',
    mute: '#5a7182',
    gold: '#b8860b',
    teal: '#0f8a7a',
    danger: '#c73e30',
    go: '#178a58',
    onGold: '#071018',
    backdrop: 'rgba(16, 32, 44, 0.45)',
  },
} as const

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark'
}

export function parseTheme(value: string | null | undefined): Theme {
  return isTheme(value) ? value : 'dark'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  root.style.colorScheme = theme
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', THEME_COLORS[theme].ink)
  }
}

export function clerkAppearance(theme: Theme) {
  const colors = THEME_COLORS[theme]
  return {
    variables: {
      colorPrimary: colors.gold,
      colorPrimaryForeground: colors.onGold,
      colorForeground: colors.foam,
      colorMutedForeground: colors.mute,
      colorBackground: colors.panel,
      colorMuted: colors.panel2,
      colorInput: colors.panel2,
      colorInputForeground: colors.foam,
      colorBorder: colors.line,
      colorDanger: colors.danger,
      colorSuccess: colors.go,
      colorNeutral: colors.mute,
      colorRing: colors.gold,
      colorModalBackdrop: colors.backdrop,
      borderRadius: '0.75rem',
      fontFamily: 'var(--font-geist-sans)',
    },
    elements: {
      headerTitle: { color: colors.foam },
      headerSubtitle: { color: colors.mute },
      socialButtonsBlockButton: {
        background: colors.panel2,
        color: colors.foam,
        border: `1px solid ${colors.line}`,
        boxShadow: 'none',
      },
      socialButtonsBlockButtonText: { color: colors.foam },
      formButtonPrimary: {
        background: colors.gold,
        color: colors.onGold,
      },
      footerActionLink: { color: colors.gold },
      formFieldInput: {
        background: colors.panel2,
        color: colors.foam,
        borderColor: colors.line,
      },
      formFieldLabel: { color: colors.foam },
      profileSection__connectedAccounts: { display: 'none' },
      profileSection__danger: { display: 'none' },
    },
  }
}
