'use client'

import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/cn'
import { ThemeToggle } from './theme-toggle'

const links = [
  { href: '/', label: 'Hunt' },
  { href: '/story', label: 'Story' },
  { href: '/blog', label: 'Blog' },
  { href: '/history', label: 'History' },
  { href: '/pricing', label: 'Pricing' },
]

export function Header() {
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const [open, setOpen] = useState(false)
  const user = useQuery(api.users.me)
  const subscribed = Boolean(
    user &&
      (user.subscriptionStatus === 'active' ||
        user.subscriptionStatus === 'trialing') &&
      (user.currentPeriodEnd == null || user.currentPeriodEnd > Date.now()),
  )
  const navLinks = links.filter(link => link.href !== '/pricing' || !subscribed)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2"
          aria-label="Find Cheap Flights home"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-gold font-display text-lg leading-none text-on-gold">
            ✈
          </span>
          <span className="hidden truncate font-display text-lg tracking-tight md:inline">
            Find Cheap Flights
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="hidden items-center gap-5 text-sm text-mute md:flex"
        >
          {navLinks.map(link => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(pathname, link.href)}
            />
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {!isSignedIn && (
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-gold hover:text-gold sm:px-4"
              >
                Sign in
              </button>
            </SignInButton>
          )}
          {isSignedIn && <UserButton />}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-mute hover:border-gold hover:text-gold md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(value => !value)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-line/70 px-4 py-3 md:hidden"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1">
            {navLinks.map(link => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={isActive(pathname, link.href)}
                className="rounded-lg px-3 py-2.5 text-base"
              />
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  href,
  label,
  active,
  className,
}: {
  href: string
  label: string
  active: boolean
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn('hover:text-foam', active && 'text-gold', className)}
    >
      {label}
    </Link>
  )
}
