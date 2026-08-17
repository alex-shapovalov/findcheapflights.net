import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { xRobotsTag } from '@/lib/seo'

const isProtectedRoute = createRouteMatcher([
  '/history(.*)',
  '/api/stripe/checkout(.*)',
  '/api/stripe/portal(.*)',
])

const isClerkRoute = createRouteMatcher([
  '/history(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/success(.*)',
  '/api(.*)',
])

const clerk = clerkMiddleware(
  async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect()
    }

    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', xRobotsTag(request.nextUrl.pathname))
    return response
  },
  { signInUrl: '/sign-in', signUpUrl: '/sign-up' },
)

export default function proxy(
  ...args: Parameters<typeof clerk>
): ReturnType<typeof clerk> {
  const request = args[0]
  if (!isClerkRoute(request)) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', xRobotsTag(request.nextUrl.pathname))
    return response
  }
  return clerk(...args)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
