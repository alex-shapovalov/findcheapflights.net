'use client'

import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from '@/lib/constants'
import { clerkAppearance } from '@/lib/theme'
import { useTheme } from './theme-provider'

export function ThemedClerkProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  return (
    <ClerkProvider
      signInUrl={SIGN_IN_PATH}
      signUpUrl={SIGN_UP_PATH}
      signInFallbackRedirectUrl={AFTER_AUTH_PATH}
      signUpFallbackRedirectUrl={AFTER_AUTH_PATH}
      appearance={clerkAppearance(theme)}
    >
      {children}
    </ClerkProvider>
  )
}
