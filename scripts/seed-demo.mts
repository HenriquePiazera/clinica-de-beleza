import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.ts'
import { generateEncryptedDek, encryptField } from '../src/lib/crypto.ts'
import { generatePublicSlug } from '../src/lib/slug.ts'

const DEMO_EMAIL = 'demo@assistente-admin.local'
const DEMO_PASSWORD = 'demo1234'
const DEMO_NAME = 'Clínica Demo Assistente Administrativo'

async function main() {
  const existing = await prisma.user.findFirst({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  })

  if (existing) {
    console.log(`Seed ok — usuário já existe: ${DEMO_EMAIL}`)
    return
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const encryptedDek = generateEncryptedDek()

  const user = await prisma.user.create({
    data: {
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password_hash: passwordHash,
      encrypted_dek: encryptedDek,
      public_slug: generatePublicSlug(DEMO_NAME),
      plan: 'professional',
      plan_status: 'active',
      trial_ends_at: null,
      onboarding_step: 99,
      onboarding_completed_at: new Date(),
      timezone: 'America/Sao_Paulo',
    },
  })

  const service = await prisma.service.create({
    data: {
      user_id: user.id,
      name: 'Consulta / Atendimento',
      description: 'Atendimento padrão da clínica demo',
      duration_minutes: 60,
      price: 120,
      is_active: true,
      sort_order: 0,
    },
  })

  for (let day = 1; day <= 5; day++) {
    await prisma.availability.create({
      data: {
        user_id: user.id,
        day_of_week: day,
        start_time: '09:00',
        end_time: '18:00',
      },
    })
  }

  const clientsData = [
    { name: 'Ana Souza', phone: '11999990001', email: 'ana.demo@example.com' },
    { name: 'Bruno Lima', phone: '11999990002', email: 'bruno.demo@example.com' },
    { name: 'Carla Mendes', phone: '11999990003', email: null },
  ]

  const clients = []
  for (const c of clientsData) {
    const notes = await encryptField(
      'Cliente fictício para demonstração — sem dados reais.',
      user.id
    )
    const client = await prisma.client.create({
      data: {
        user_id: user.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        notes,
      },
    })
    clients.push(client)
  }

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)
  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(11, 0, 0, 0)

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(14, 0, 0, 0)
  const yesterdayEnd = new Date(yesterday)
  yesterdayEnd.setHours(15, 0, 0, 0)

  const apptPast = await prisma.appointment.create({
    data: {
      user_id: user.id,
      client_id: clients[0].id,
      service_id: service.id,
      start_time: yesterday,
      end_time: yesterdayEnd,
      status: 'completed',
      notes: 'Atendimento concluído (demo)',
    },
  })

  await prisma.appointment.create({
    data: {
      user_id: user.id,
      client_id: clients[1].id,
      service_id: service.id,
      start_time: tomorrow,
      end_time: tomorrowEnd,
      status: 'scheduled',
      notes: 'Próximo horário (demo)',
    },
  })

  const description = await encryptField(
    'Avaliação inicial — registro fictício de demonstração.',
    user.id
  )
  const evolution = await encryptField(
    'Evolução positiva — texto de exemplo.',
    user.id
  )

  await prisma.serviceRecord.create({
    data: {
      user_id: user.id,
      client_id: clients[0].id,
      appointment_id: apptPast.id,
      description,
      evolution,
    },
  })

  await prisma.payment.create({
    data: {
      user_id: user.id,
      client_id: clients[0].id,
      appointment_id: apptPast.id,
      amount: 120,
      payment_method: 'pix',
      status: 'paid',
      paid_at: yesterdayEnd,
      receipt_number: 1,
      receipt_issued_at: yesterdayEnd,
    },
  })

  console.log('Seed criado:')
  console.log(`  e-mail: ${DEMO_EMAIL}`)
  console.log(`  senha:  ${DEMO_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
