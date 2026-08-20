import 'dotenv/config'
import { randomBytes } from 'crypto'
import { prisma } from '../src/lib/prisma.ts'

async function main() {
  const label = process.argv[2] ?? `demo-${new Date().toISOString().slice(0, 10)}`
  const token = randomBytes(24).toString('hex')
  const hours = Number(process.env.DEMO_SESSION_HOURS ?? '2')

  await prisma.demoAccessLink.create({
    data: { token, label },
  })

  const base = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    ''
  )
  const url = `${base}/demo/${token}`

  console.log('\nLink de demonstração criado')
  console.log(`Label:   ${label}`)
  console.log(`Janela:  ${hours}h a partir do 1º acesso`)
  console.log(`URL:     ${url}\n`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
