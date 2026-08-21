import { describe, expect, it } from 'vitest'
import { APP_LOGO_PATH, APP_NAME, APP_SLOGAN, APP_TAGLINE } from '@/lib/brand'
import { isBillingEnabled } from '@/lib/billing'
import { checkPlanLimit } from '@/lib/plan-limits'
import { generatePublicSlug, slugifyName } from '@/lib/slug'

describe('marca da clínica', () => {
  it('usa identidade Clínica Mariana Oliveira', () => {
    expect(APP_NAME).toContain('Mariana Oliveira')
    expect(APP_TAGLINE.toLowerCase()).toMatch(/estética|beleza|bem-estar/)
    expect(APP_SLOGAN.length).toBeGreaterThan(10)
    expect(APP_LOGO_PATH).toMatch(/logo-clinica-mariana-oliveira/)
  })
})

describe('billing e limites', () => {
  it('BILLING_ENABLED=false libera checkPlanLimit sem consultar plano', async () => {
    expect(isBillingEnabled()).toBe(false)
    const result = await checkPlanLimit('qualquer-user-id', 'max_professionals')
    expect(result).toEqual({ allowed: true })
  })
})

describe('slug público', () => {
  it('slugify remove acentos e espaços', () => {
    expect(slugifyName('Mariana Oliveira')).toBe('mariana-oliveira')
    expect(slugifyName('Clínica de Beleza')).toBe('clinica-de-beleza')
  })

  it('generatePublicSlug adiciona sufixo único', () => {
    const a = generatePublicSlug('Camila Santos')
    const b = generatePublicSlug('Camila Santos')
    expect(a).toMatch(/^camila-santos-[a-f0-9]{6}$/)
    expect(b).toMatch(/^camila-santos-[a-f0-9]{6}$/)
    expect(a).not.toBe(b)
  })
})
