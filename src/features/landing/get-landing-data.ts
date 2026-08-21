import { prisma } from '@/lib/prisma'
import { getTeamMemberIds } from '@/lib/team'

export type LandingService = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number | null
}

export type LandingProfessional = {
  id: string
  name: string
  bio: string | null
  photo_url: string | null
  slug: string | null
  services: LandingService[]
}

export type LandingClinicData = {
  bookingSlug: string | null
  professionals: LandingProfessional[]
}

function resolveOwnerEmail(): string {
  const fromEnv = (process.env.PLATFORM_OWNER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)[0]
  return fromEnv || 'mariana@clinica-mariana.local'
}

/** Dados públicos da clínica para a landing (profissionais + serviços ativos). */
export async function getLandingClinicData(): Promise<LandingClinicData> {
  const ownerEmail = resolveOwnerEmail()

  const owner = await prisma.user.findFirst({
    where: { email: ownerEmail },
    select: {
      id: true,
      name: true,
      public_slug: true,
      public_bio: true,
      public_photo_url: true,
    },
  })

  if (!owner) {
    return { bookingSlug: null, professionals: [] }
  }

  const memberIds = await getTeamMemberIds(owner.id)

  const users = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: {
      id: true,
      name: true,
      public_slug: true,
      public_bio: true,
      public_photo_url: true,
    },
    orderBy: { name: 'asc' },
  })

  // Dona primeiro, depois equipe por nome
  users.sort((a, b) => {
    if (a.id === owner.id) return -1
    if (b.id === owner.id) return 1
    return a.name.localeCompare(b.name, 'pt-BR')
  })

  const services = await prisma.service.findMany({
    where: { user_id: { in: memberIds }, is_active: true },
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      user_id: true,
      name: true,
      description: true,
      duration_minutes: true,
      price: true,
    },
  })

  const byUser = new Map<string, LandingService[]>()
  for (const s of services) {
    const list = byUser.get(s.user_id) ?? []
    list.push({
      id: s.id,
      name: s.name,
      description: s.description,
      duration_minutes: s.duration_minutes,
      price: s.price ? Number(s.price) : null,
    })
    byUser.set(s.user_id, list)
  }

  const professionals: LandingProfessional[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    bio: u.public_bio,
    photo_url: u.public_photo_url,
    slug: u.public_slug,
    services: byUser.get(u.id) ?? [],
  }))

  return {
    bookingSlug: owner.public_slug,
    professionals,
  }
}
