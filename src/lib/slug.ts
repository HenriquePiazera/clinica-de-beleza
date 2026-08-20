import { randomBytes } from 'crypto'

export function slugifyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function generatePublicSlug(name: string): string {
  const base = slugifyName(name) || 'profissional'
  const suffix = randomBytes(3).toString('hex')
  return `${base}-${suffix}`
}
