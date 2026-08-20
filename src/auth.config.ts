import type { NextAuthConfig } from 'next-auth'

function getPlatformOwnerEmails(): string[] {
  const raw = process.env.PLATFORM_OWNER_EMAILS ?? ''
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const owners = getPlatformOwnerEmails()
  if (owners.length === 0) return false
  return owners.includes(email.trim().toLowerCase())
}

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user)
      const publicPaths = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/demo-expired',
      ]
      const isPublicPath =
        nextUrl.pathname === '/' ||
        nextUrl.pathname === '/landing' ||
        nextUrl.pathname.startsWith('/demo/') ||
        nextUrl.pathname.startsWith('/p/') ||
        nextUrl.pathname.startsWith('/confirm/') ||
        publicPaths.some((path) => nextUrl.pathname.startsWith(path))

      if (isPublicPath) {
        return true
      }

      if (nextUrl.pathname.startsWith('/onboarding')) {
        return isLoggedIn
      }

      if (nextUrl.pathname.startsWith('/internal')) {
        return isLoggedIn && isPlatformOwnerEmail(auth?.user?.email)
      }

      const isProtectedRoute =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/clients') ||
        nextUrl.pathname.startsWith('/appointments') ||
        nextUrl.pathname.startsWith('/records') ||
        nextUrl.pathname.startsWith('/payments') ||
        nextUrl.pathname.startsWith('/account') ||
        nextUrl.pathname.startsWith('/settings') ||
        nextUrl.pathname.startsWith('/feedback')

      if (isProtectedRoute) {
        return isLoggedIn
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
} satisfies NextAuthConfig
