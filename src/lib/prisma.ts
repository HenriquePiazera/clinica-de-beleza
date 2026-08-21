import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: pg.Pool | undefined
}

function createPool() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
    allowExitOnIdle: true,
  })

  // Evita derrubar o processo Next quando o prisma dev fecha uma conexão ociosa
  pool.on('error', (err) => {
    console.error('[prisma] pool error (reconectará na próxima query):', err.message)
  })

  return pool
}

function createPrismaClient() {
  const pool = globalForPrisma.pgPool ?? createPool()
  globalForPrisma.pgPool = pool
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
