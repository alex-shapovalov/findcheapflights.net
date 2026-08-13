'use client'

import { useAuth } from '@clerk/nextjs'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import type { ReactNode } from 'react'
import type { Theme } from '@/lib/theme'
import { ThemeProvider } from './theme-provider'
import { ThemedClerkProvider } from './themed-clerk-provider'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex =
  convexUrl && URL.canParse(convexUrl) ? new ConvexReactClient(convexUrl) : null

export function Providers({
  children,
  initialTheme,
}: {
  children: ReactNode
  initialTheme: Theme
}) {
  const inner = convex ? (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  ) : (
    children
  )
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ThemedClerkProvider>{inner}</ThemedClerkProvider>
    </ThemeProvider>
  )
}
