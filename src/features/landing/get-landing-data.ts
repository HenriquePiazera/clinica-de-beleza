import { prisma } from '@/lib/prisma'
import { getTeamMemberIds } from '@/lib/team'
import { resolveServicePhotoUrl } from '@/lib/service-photo'

export type LandingService = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number | null
  photo_url: string | null
}

export type LandingProfessional = {
  id: string
  name: string
  bio: string | null
  photo_url: string | null
  slug: string | null
  services: LandingService[]
}

export type LandingReview = {
  id: string
  author_name: string
  rating: number
  message: string
}

export type LandingClinicData = {
  bookingSlug: string | null
  professionals: LandingProfessional[]
  reviews: LandingReview[]
}

function resolveOwnerEmail(): string {
  const fromEnv = (process.env.PLATFORM_OWNER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)[0]
  return fromEnv || 'mariana@clinica-mariana.local'
}

async function listLandingReviews(): Promise<LandingReview[]> {
  try {
    // Preferência: delegate tipado. Fallback raw se o client em memória estiver antigo.
    const delegate = (
      prisma as unknown as {
        clinicReview?: {
          findMany: (args: unknown) => Promise<
            {
              id: string
              author_name: string
              rating: number
              message: string
            }[]
          >
        }
      }
    ).clinicReview

    if (delegate?.findMany) {
      const reviewRows = await delegate.findMany({
        where: {
          show_on_landing: true,
          status: 'published',
          allow_publish: true,
        },
        orderBy: { moderated_at: 'desc' },
        take: 12,
        select: {
          id: true,
          author_name: true,
          rating: true,
          message: true,
        },
      })
      return reviewRows.map((r) => ({
        id: r.id,
        author_name: r.author_name,
        rating: r.rating,
        message: r.message,
      }))
    }

    const reviewRows = await prisma.$queryRaw<
      {
        id: string
        author_name: string
        rating: number
        message: string
      }[]
    >`
      SELECT id, author_name, rating, message
      FROM clinic_reviews
      WHERE show_on_landing = true
        AND status = 'published'
        AND allow_publish = true
      ORDER BY moderated_at DESC NULLS LAST
      LIMIT 12
    `
    return reviewRows.map((r) => ({
      id: r.id,
      author_name: r.author_name,
      rating: Number(r.rating),
      message: r.message,
    }))
  } catch (error) {
    console.error('[landing] falha ao carregar depoimentos:', error)
    return []
  }
}

/** Dados públicos da clínica para a landing (profissionais + serviços ativos). */
export async function getLandingClinicData(): Promise<LandingClinicData> {
  try {
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
      return { bookingSlug: null, professionals: [], reviews: [] }
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
        photo_url: true,
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
        photo_url: resolveServicePhotoUrl(s.id, s.photo_url),
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

    const reviews = await listLandingReviews()

    return {
      bookingSlug: owner.public_slug,
      professionals,
      reviews,
    }
  } catch (error) {
    console.error('[landing] falha ao carregar dados da clínica:', error)
    return { bookingSlug: null, professionals: [], reviews: [] }
  }
}
