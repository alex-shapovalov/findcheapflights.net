import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

export function convexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) throw new Error('Convex error: Convex is not configured 205')
  return url
}

export function getConvexClient() {
  return new ConvexHttpClient(convexUrl())
}

export function convexServerSecret() {
  const secret = process.env.CONVEX_SERVER_SECRET
  if (!secret) {
    throw new Error('Convex error: Convex server is not configured 206')
  }
  return secret
}

export async function getAuthedConvex() {
  const { getToken } = await auth()
  const token = await getToken({ template: 'convex' })
  const client = getConvexClient()
  if (token) client.setAuth(token)
  return client
}

export { api }
