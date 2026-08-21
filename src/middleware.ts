import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

const { auth: middleware } = NextAuth(authConfig)

export default middleware

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon\\.png|icon\\.svg|logo\\.png|logo-clinica-mariana-oliveira\\.png|professionals/|manifest\\.json|sw\\.js).*)',
  ],
}
