import 'dotenv/config'
import { prisma } from '../src/lib/prisma.ts'

const n = await prisma.user.count()
console.log('ok users=', n)
await prisma.$disconnect()
