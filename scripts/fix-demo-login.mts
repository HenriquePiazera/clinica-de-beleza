import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.ts'
import { generateEncryptedDek } from '../src/lib/crypto.ts'
import { generatePublicSlug } from '../src/lib/slug.ts'

const OWNER_EMAIL = 'mariana@clinica-mariana.local'
const OWNER_PASSWORD = 'beleza1234'
const OWNER_NAME = 'Mariana Oliveira'
const LEGACY_EMAILS = [
  'demo@assistente-admin.local',
  'demo@atendo.local',
]

async function main() {
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12)

  for (const oldEmail of LEGACY_EMAILS) {
    const old = await prisma.user.findFirst({ where: { email: oldEmail } })
    if (!old) continue
    await prisma.user.update({
      where: { id: old.id },
      data: {
        email: OWNER_EMAIL,
        name: OWNER_NAME,
        password_hash: passwordHash,
        public_bio: 'Esteticista',
        plan: 'team',
        plan_status: 'active',
        onboarding_completed_at: old.onboarding_completed_at ?? new Date(),
        onboarding_step: 99,
      },
    })
    console.log(`Atualizado ${oldEmail} → ${OWNER_EMAIL}`)
  }

  let user = await prisma.user.findFirst({ where: { email: OWNER_EMAIL } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: OWNER_NAME,
        email: OWNER_EMAIL,
        password_hash: passwordHash,
        encrypted_dek: generateEncryptedDek(),
        public_slug: generatePublicSlug(OWNER_NAME),
        public_bio: 'Esteticista',
        plan: 'team',
        plan_status: 'active',
        onboarding_step: 99,
        onboarding_completed_at: new Date(),
        timezone: 'America/Sao_Paulo',
      },
    })
    console.log(`Criado ${OWNER_EMAIL}`)
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        onboarding_completed_at: user.onboarding_completed_at ?? new Date(),
        onboarding_step: 99,
      },
    })
    console.log(`Senha resetada para ${OWNER_EMAIL}`)
  }

  const users = await prisma.user.findMany({
    select: { email: true, name: true },
  })
  console.log('Usuários:', users)
  console.log(`Login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
