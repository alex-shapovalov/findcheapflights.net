'use client'

import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const links = [
  { href: '/', label: 'Hunt' },
  { href: '/history', label: 'History' },
  { href: '/pricing', label: 'Pricing' },
]

export function Header() {
  const pathname = usePathname()
  const { isSignedIn } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Find Cheap Flights home"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gold text-ink font-display text-lg leading-none">
            ✈
          </span>
          <span className="font-display text-lg tracking-tight">
            Find Cheap Flights
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="flex items-center gap-4 text-sm text-mute"
        >
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'hover:text-foam',
                pathname === link.href && 'text-gold',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {!isSignedIn && (
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-gold hover:text-gold"
              >
                Sign in
              </button>
            </SignInButton>
          )}
          {isSignedIn && <UserButton />}
        </div>
      </div>
    </header>
  )
}
