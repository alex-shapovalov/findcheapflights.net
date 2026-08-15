'use client'

import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'
import { clerkAppearance } from '@/lib/theme'
import { useTheme } from './theme-provider'

export function ThemedClerkProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={clerkAppearance(theme)}
    >
      {children}
    </ClerkProvider>
  )
}
