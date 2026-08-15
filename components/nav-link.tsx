'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

export function NavLink({
  href,
  label,
  className,
  onClick,
}: {
  href: string
  label: string
  className?: string
  onClick?: () => void
}) {
  const pathname = usePathname()
  const active =
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn('hover:text-foam', active && 'text-gold', className)}
    >
      {label}
    </Link>
  )
}
