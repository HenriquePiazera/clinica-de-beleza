import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.ts'
import { generateEncryptedDek, encryptField } from '../src/lib/crypto.ts'
import { generatePublicSlug } from '../src/lib/slug.ts'

const OWNER_EMAIL = 'mariana@clinica-mariana.local'
const DEFAULT_PASSWORD = 'beleza1234'

type ProfessionalSeed = {
  name: string
  email: string
  bio: string
  photo_url: string
  days: number[]
  start: string
  end: string
  services: {
    name: string
    duration_minutes: number
    price: number
    sort_order: number
  }[]
}

const professionals: ProfessionalSeed[] = [
  {
    name: 'Mariana Oliveira',
    email: OWNER_EMAIL,
    bio: 'Esteticista',
    photo_url: '/professionals/mariana-oliveira.jpg',
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '18:00',
    services: [
      { name: 'Limpeza de pele', duration_minutes: 60, price: 120, sort_order: 0 },
      { name: 'Drenagem linfática', duration_minutes: 60, price: 150, sort_order: 1 },
      { name: 'Tratamento facial', duration_minutes: 60, price: 180, sort_order: 2 },
    ],
  },
  {
    name: 'Camila Santos',
    email: 'camila@clinica-mariana.local',
    bio: 'Designer de Sobrancelhas',
    photo_url: '/professionals/camila-santos.jpg',
    days: [1, 2, 3, 4, 5],
    start: '10:00',
    end: '19:00',
    services: [
      { name: 'Design de sobrancelhas', duration_minutes: 40, price: 60, sort_order: 0 },
      { name: 'Design com henna', duration_minutes: 50, price: 80, sort_order: 1 },
      { name: 'Brow lamination', duration_minutes: 60, price: 120, sort_order: 2 },
    ],
  },
  {
    name: 'Juliana Costa',
    email: 'juliana@clinica-mariana.local',
    bio: 'Manicure e Pedicure',
    photo_url: '/professionals/juliana-costa.jpg',
    days: [2, 4],
    start: '09:00',
    end: '17:00',
    services: [
      { name: 'Manicure', duration_minutes: 45, price: 45, sort_order: 0 },
      { name: 'Pedicure', duration_minutes: 45, price: 50, sort_order: 1 },
      { name: 'Manicure + Pedicure', duration_minutes: 90, price: 85, sort_order: 2 },
    ],
  },
]

async function ensureProfessional(seed: ProfessionalSeed, isOwner: boolean) {
  const existing = await prisma.user.findFirst({
    where: { email: seed.email },
    select: { id: true, public_slug: true },
  })

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: seed.name,
        public_bio: seed.bio,
        public_photo_url: seed.photo_url,
        plan: isOwner ? 'team' : 'professional',
        plan_status: 'active',
        onboarding_step: 99,
        onboarding_completed_at: new Date(),
        public_slug: existing.public_slug || generatePublicSlug(seed.name),
      },
    })
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12)
  return prisma.user.create({
    data: {
      name: seed.name,
      email: seed.email,
      password_hash: passwordHash,
      encrypted_dek: generateEncryptedDek(),
      public_slug: generatePublicSlug(seed.name),
      public_bio: seed.bio,
      public_photo_url: seed.photo_url,
      plan: isOwner ? 'team' : 'professional',
      plan_status: 'active',
      trial_ends_at: null,
      onboarding_step: 99,
      onboarding_completed_at: new Date(),
      timezone: 'America/Sao_Paulo',
    },
  })
}

async function syncAvailability(userId: string, seed: ProfessionalSeed) {
  await prisma.availability.deleteMany({ where: { user_id: userId } })
  for (const day of seed.days) {
    await prisma.availability.create({
      data: {
        user_id: userId,
        day_of_week: day,
        start_time: seed.start,
        end_time: seed.end,
        is_active: true,
      },
    })
  }
}

async function syncServices(userId: string, seed: ProfessionalSeed) {
  const desiredNames = new Set(seed.services.map((s) => s.name))

  const existing = await prisma.service.findMany({
    where: { user_id: userId },
    select: { id: true, name: true },
  })

  for (const row of existing) {
    if (!desiredNames.has(row.name)) {
      const linked = await prisma.appointment.count({
        where: { service_id: row.id },
      })
      if (linked === 0) {
        await prisma.service.delete({ where: { id: row.id } })
      } else {
        await prisma.service.update({
          where: { id: row.id },
          data: { is_active: false },
        })
      }
    }
  }

  for (const service of seed.services) {
    const found = await prisma.service.findFirst({
      where: { user_id: userId, name: service.name },
      select: { id: true },
    })
    if (found) {
      await prisma.service.update({
        where: { id: found.id },
        data: {
          duration_minutes: service.duration_minutes,
          price: service.price,
          is_active: true,
          sort_order: service.sort_order,
        },
      })
    } else {
      await prisma.service.create({
        data: {
          user_id: userId,
          name: service.name,
          description: null,
          duration_minutes: service.duration_minutes,
          price: service.price,
          is_active: true,
          sort_order: service.sort_order,
        },
      })
    }
  }
}

async function main() {
  const ownerSeed = professionals[0]
  const owner = await ensureProfessional(ownerSeed, true)
  await syncAvailability(owner.id, ownerSeed)
  await syncServices(owner.id, ownerSeed)

  for (const memberSeed of professionals.slice(1)) {
    const member = await ensureProfessional(memberSeed, false)
    await syncAvailability(member.id, memberSeed)
    await syncServices(member.id, memberSeed)

    const existingMembership = await prisma.teamMember.findFirst({
      where: { owner_id: owner.id, member_id: member.id },
    })
    if (!existingMembership) {
      await prisma.teamMember.create({
        data: {
          owner_id: owner.id,
          member_id: member.id,
          role: 'member',
          status: 'active',
          joined_at: new Date(),
        },
      })
    } else if (existingMembership.status !== 'active') {
      await prisma.teamMember.update({
        where: { id: existingMembership.id },
        data: { status: 'active', joined_at: new Date() },
      })
    }
  }

  const clientsCount = await prisma.client.count({ where: { user_id: owner.id } })
  if (clientsCount === 0) {
    const clientsData = [
      { name: 'Ana Souza', phone: '11999990001', email: 'ana.exemplo@example.com' },
      { name: 'Bruno Lima', phone: '11999990002', email: 'bruno.exemplo@example.com' },
      { name: 'Carla Mendes', phone: '11999990003', email: null },
    ]

    for (const c of clientsData) {
      const notes = await encryptField(
        'Cliente de exemplo do seed — substituir por dados reais.',
        owner.id
      )
      await prisma.client.create({
        data: {
          user_id: owner.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          notes,
        },
      })
    }
  }

  console.log('Profissionais sincronizados:')
  for (const p of professionals) {
    console.log(`  ${p.name} — ${p.bio} — ${p.photo_url}`)
    console.log(`    serviços: ${p.services.map((s) => s.name).join(', ')}`)
  }
  console.log(`Login: ${OWNER_EMAIL} / ${DEFAULT_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
