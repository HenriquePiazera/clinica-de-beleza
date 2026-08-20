'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

type Member = {
  id: string
  name: string
  slug: string
}

type Props = {
  ownerSlug: string
  ownerName: string
  members: Member[]
}

export function PublicProfessionalPicker({
  ownerSlug,
  ownerName,
  members,
}: Props) {
  const params = useParams()
  const currentSlug = String(params.slug)

  const options = [
    { slug: ownerSlug, name: ownerName },
    ...members.map((m) => ({ slug: m.slug, name: m.name })),
  ]

  return (
    <div className="bg-background rounded-lg border p-4">
      <p className="mb-3 text-sm font-medium">Escolha o profissional</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Link
            key={option.slug}
            href={`/p/${option.slug}`}
            className={`min-h-11 rounded-md border px-4 py-2 text-sm ${
              currentSlug === option.slug
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input hover:bg-muted'
            }`}
          >
            {option.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
