'use server'

import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { checkPlanLimit } from '@/lib/plan-limits'
import { getAppBaseUrl } from '@/lib/app-url'
import { isPastDateTime } from '@/lib/datetime'
import { generatePublicSlug } from '@/lib/slug'
import { resolveServicePhotoUrl } from '@/lib/service-photo'
import { checkAppointmentConflict } from '@/services/appointment-conflict.service'
import { isSlotAvailable } from '@/services/availability-slots.service'
import { sendAppointmentNotification } from '@/services/notification.service'
import { z } from 'zod'

const publicBookingSchema = z.object({
  slug: z.string().min(1),
  service_id: z.string().min(1),
  start_time: z.string().min(1),
  client_name: z.string().min(1).max(120),
  client_phone: z.string().min(8).max(20),
  client_email: z.string().email().optional().or(z.literal('')),
})

export type PublicProfessionalDTO = {
  id: string
  name: string
  slug: string
  bio: string | null
  photo_url: string | null
  services: {
    id: string
    name: string
    description: string | null
    photo_url: string | null
    duration_minutes: number
    price: number | null
  }[]
  team_members?: {
    id: string
    name: string
    slug: string
    bio: string | null
    photo_url: string | null
  }[]
  setup: {
    services_count: number
    availability_count: number
    ready: boolean
  }
}

export async function getPublicProfessionalBySlug(
  slug: string
): Promise<PublicProfessionalDTO | null> {
  const user = await prisma.user.findFirst({
    where: { public_slug: slug },
    select: {
      id: true,
      name: true,
      public_slug: true,
      public_bio: true,
      public_photo_url: true,
      plan: true,
    },
  })

  if (!user?.public_slug) return null

  const limit = await checkPlanLimit(user.id, 'public_page')
  if (!limit.allowed) return null

  const services = await prisma.service.findMany({
    where: { user_id: user.id, is_active: true },
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
  })

  const availabilityCount = await prisma.availability.count({
    where: { user_id: user.id, is_active: true },
  })

  const dto: PublicProfessionalDTO = {
    id: user.id,
    name: user.name,
    slug: user.public_slug,
    bio: user.public_bio,
    photo_url: user.public_photo_url,
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      photo_url: resolveServicePhotoUrl(s.id, s.photo_url),
      duration_minutes: s.duration_minutes,
      price: s.price ? s.price.toNumber() : null,
    })),
    setup: {
      services_count: services.length,
      availability_count: availabilityCount,
      ready: services.length > 0 && availabilityCount > 0,
    },
  }

  if (user.plan === 'team' || !isBillingEnabledCheck()) {
    const ownerTeams = await prisma.teamMember.findMany({
      where: { owner_id: user.id, status: 'active' },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            public_slug: true,
            public_bio: true,
            public_photo_url: true,
          },
        },
      },
    })
    const teamMembers = ownerTeams
      .map((t) => t.member)
      .filter((m) => m.public_slug)
      .map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.public_slug!,
        bio: m.public_bio,
        photo_url: m.public_photo_url,
      }))
    if (teamMembers.length > 0) {
      dto.team_members = teamMembers
    }
  }

  return dto
}

function isBillingEnabledCheck(): boolean {
  return process.env.BILLING_ENABLED === 'true'
}

export async function createPublicBooking(input: {
  slug: string
  service_id: string
  start_time: string
  client_name: string
  client_phone: string
  client_email?: string
}): Promise<
  | {
      success: true
      appointmentId: string
      confirmationToken: string
      confirmUrl: string
      emailSent: boolean
      notificationChannel: 'push' | 'email' | 'none'
    }
  | { success: false; error: string }
> {
  const parsed = publicBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Dados inválidos.' }
  }

  const professional = await prisma.user.findFirst({
    where: { public_slug: parsed.data.slug },
    select: { id: true, public_slug: true, timezone: true },
  })
  if (!professional?.public_slug) {
    return { success: false, error: 'Profissional não encontrado.' }
  }

  const pageLimit = await checkPlanLimit(professional.id, 'public_page')
  if (!pageLimit.allowed) {
    return { success: false, error: 'Agendamento online indisponível.' }
  }

  const service = await prisma.service.findFirst({
    where: {
      id: parsed.data.service_id,
      user_id: professional.id,
      is_active: true,
    },
  })
  if (!service) {
    return { success: false, error: 'Serviço não encontrado.' }
  }

  const startTime = new Date(parsed.data.start_time)
  const endTime = new Date(
    startTime.getTime() + service.duration_minutes * 60 * 1000
  )

  if (isPastDateTime(startTime)) {
    return { success: false, error: 'Não é possível agendar em horário passado.' }
  }

  const slotAllowed = await isSlotAvailable(
    professional.id,
    startTime,
    service.duration_minutes,
    professional.timezone
  )
  if (!slotAllowed) {
    return { success: false, error: 'Horário indisponível. Escolha outro.' }
  }

  const conflict = await checkAppointmentConflict(
    professional.id,
    startTime,
    endTime,
    0
  )
  if (conflict.hasConflict) {
    return { success: false, error: 'Horário indisponível. Escolha outro.' }
  }

  const email = parsed.data.client_email?.trim() || null
  const phone = parsed.data.client_phone.trim()

  let client = await prisma.client.findFirst({
    where: {
      user_id: professional.id,
      phone,
    },
  })

  if (!client) {
    const clientLimit = await checkPlanLimit(professional.id, 'max_clients')
    if (!clientLimit.allowed) {
      return { success: false, error: 'Limite de clientes atingido.' }
    }

    client = await prisma.client.create({
      data: {
        user_id: professional.id,
        name: parsed.data.client_name.trim(),
        phone,
        email,
      },
    })
  } else if (email && !client.email) {
    client = await prisma.client.update({
      where: { id: client.id },
      data: { email, name: parsed.data.client_name.trim() },
    })
  } else if (client.name !== parsed.data.client_name.trim()) {
    client = await prisma.client.update({
      where: { id: client.id },
      data: { name: parsed.data.client_name.trim() },
    })
  }

  const appointment = await prisma.appointment.create({
    data: {
      user_id: professional.id,
      client_id: client.id,
      service_id: service.id,
      start_time: startTime,
      end_time: endTime,
      status: 'awaiting_confirmation',
    },
    include: {
      client: true,
      service: true,
      user: { select: { name: true } },
    },
  })

  const token = randomBytes(32).toString('hex')
  await prisma.appointmentConfirmation.create({
    data: {
      appointment_id: appointment.id,
      token,
    },
  })

  const notification = await sendAppointmentNotification({
    type: 'confirmation',
    appointment: {
      id: appointment.id,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      professionalName: appointment.user.name,
      serviceName: appointment.service?.name ?? 'Atendimento',
    },
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      push_subscription: client.push_subscription,
    },
    confirmationToken: token,
  })

  const baseUrl = await getAppBaseUrl()
  const confirmUrl = `${baseUrl}/confirm/${token}`

  return {
    success: true,
    appointmentId: appointment.id,
    confirmationToken: token,
    confirmUrl,
    emailSent: notification.channel === 'email',
    notificationChannel: notification.channel,
  }
}

export async function confirmAppointmentByToken(
  token: string
): Promise<{ success: boolean; message: string }> {
  const confirmation = await prisma.appointmentConfirmation.findFirst({
    where: { token, status: 'pending' },
    include: {
      appointment: {
        include: { client: true, user: { select: { name: true } } },
      },
    },
  })

  if (!confirmation) {
    return { success: false, message: 'Link inválido ou já utilizado.' }
  }

  const sentAt = confirmation.sent_at.getTime()
  const expiresAt = sentAt + 7 * 24 * 60 * 60 * 1000
  if (Date.now() > expiresAt) {
    await prisma.appointmentConfirmation.update({
      where: { id: confirmation.id },
      data: { status: 'expired' },
    })
    return { success: false, message: 'Este link expirou.' }
  }

  await prisma.$transaction([
    prisma.appointmentConfirmation.update({
      where: { id: confirmation.id },
      data: { status: 'confirmed', confirmed_at: new Date() },
    }),
    prisma.appointment.update({
      where: { id: confirmation.appointment_id },
      data: { status: 'confirmed' },
    }),
  ])

  return {
    success: true,
    message: `Agendamento confirmado com ${confirmation.appointment.user.name}.`,
  }
}

export async function savePushSubscription(input: {
  slug: string
  client_phone: string
  subscription: string
  appointmentId?: string
}): Promise<{ success: boolean; pushSent?: boolean }> {
  const professional = await prisma.user.findFirst({
    where: { public_slug: input.slug },
  })
  if (!professional) return { success: false }

  const client = await prisma.client.findFirst({
    where: { user_id: professional.id, phone: input.client_phone.trim() },
  })
  if (!client) return { success: false }

  await prisma.client.update({
    where: { id: client.id },
    data: {
      push_subscription: input.subscription,
      pwa_installed_at: new Date(),
    },
  })

  if (input.appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: input.appointmentId,
        user_id: professional.id,
        client_id: client.id,
      },
      include: {
        service: { select: { name: true } },
        user: { select: { name: true } },
        confirmations: {
          where: { status: 'pending' },
          orderBy: { sent_at: 'desc' },
          take: 1,
        },
      },
    })

    if (appointment) {
      const notification = await sendAppointmentNotification({
        type: 'confirmation',
        appointment: {
          id: appointment.id,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          professionalName: appointment.user.name,
          serviceName: appointment.service?.name ?? 'Atendimento',
        },
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          push_subscription: input.subscription,
        },
        confirmationToken: appointment.confirmations[0]?.token,
      })
      return { success: true, pushSent: notification.channel === 'push' }
    }
  }

  return { success: true }
}

export async function ensurePublicSlug(userId: string): Promise<string> {
  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId },
    select: { public_slug: true, name: true },
  })

  if (user.public_slug) {
    return user.public_slug
  }

  let slug = generatePublicSlug(user.name)
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await prisma.user.findFirst({ where: { public_slug: slug } })
    if (!exists) break
    slug = generatePublicSlug(user.name)
  }

  await prisma.user.update({
    where: { id: userId },
    data: { public_slug: slug },
  })

  return slug
}
