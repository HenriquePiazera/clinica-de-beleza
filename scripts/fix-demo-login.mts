import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.ts'
import { generateEncryptedDek } from '../src/lib/crypto.ts'
import { generatePublicSlug } from '../src/lib/slug.ts'

const DEMO_EMAIL = 'demo@assistente-admin.local'
const DEMO_PASSWORD = 'demo1234'
const DEMO_NAME = 'Clínica Demo Assistente Administrativo'
const OLD_EMAIL = 'demo@atendo.local'

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  const old = await prisma.user.findFirst({ where: { email: OLD_EMAIL } })
  if (old) {
    await prisma.user.update({
      where: { id: old.id },
      data: {
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        password_hash: passwordHash,
        onboarding_completed_at: old.onboarding_completed_at ?? new Date(),
        onboarding_step: 99,
      },
    })
    console.log(`Atualizado ${OLD_EMAIL} → ${DEMO_EMAIL}`)
  }

  let user = await prisma.user.findFirst({ where: { email: DEMO_EMAIL } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        password_hash: passwordHash,
        encrypted_dek: generateEncryptedDek(),
        public_slug: generatePublicSlug(DEMO_NAME),
        plan: 'professional',
        plan_status: 'active',
        onboarding_step: 99,
        onboarding_completed_at: new Date(),
        timezone: 'America/Sao_Paulo',
      },
    })
    console.log(`Criado ${DEMO_EMAIL}`)
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        onboarding_completed_at: user.onboarding_completed_at ?? new Date(),
        onboarding_step: 99,
      },
    })
    console.log(`Senha resetada para ${DEMO_EMAIL}`)
  }

  const users = await prisma.user.findMany({
    select: { email: true, name: true },
  })
  console.log('Usuários:', users)
  console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
