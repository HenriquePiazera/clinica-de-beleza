import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

const { auth: middleware } = NextAuth(authConfig)

export default middleware

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon\\.png|icon\\.svg|demo-assistente-logo\\.svg|logo\\.png|manifest\\.json|sw\\.js).*)',
  ],
}
