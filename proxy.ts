import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { SIGN_IN_PATH, SIGN_UP_PATH } from '@/lib/constants'
import { xRobotsTag } from '@/lib/seo'

const isProtectedRoute = createRouteMatcher([
  '/history(.*)',
  '/api/stripe/checkout(.*)',
  '/api/stripe/portal(.*)',
])

export default clerkMiddleware(
  async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect()
    }

    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', xRobotsTag(request.nextUrl.pathname))
    return response
  },
  { signInUrl: SIGN_IN_PATH, signUpUrl: SIGN_UP_PATH },
)

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
