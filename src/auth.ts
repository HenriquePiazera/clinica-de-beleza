import bcrypt from 'bcryptjs'
import Credentials from 'next-auth/providers/credentials'
import NextAuth from 'next-auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { authConfig } from '@/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = String(credentials.email).toLowerCase()
        const user = await prisma.user.findFirst({
          where: { email },
        })

        if (!user) {
          return null
        }

        const valid = await bcrypt.compare(
          String(credentials.password),
          user.password_hash
        )

        if (!valid) {
          return null
        }

        await logAudit({
          userId: user.id,
          operation: 'user.login',
          entity: 'User',
          entityId: user.id,
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
})
