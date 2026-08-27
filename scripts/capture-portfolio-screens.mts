/**
 * Captura prints reais do sistema em produção (Upwork/portfólio).
 * Uso: npx tsx scripts/capture-portfolio-screens.mts
 */
/// <reference types="node" />
import { chromium } from '@playwright/test'
import { mkdir } from 'fs/promises'
import path from 'path'

const BASE = process.env.PORTFOLIO_BASE_URL ?? 'https://clinica-de-beleza.vercel.app'
const EMAIL = process.env.PORTFOLIO_EMAIL ?? 'mariana@clinica-mariana.local'
const PASSWORD = process.env.PORTFOLIO_PASSWORD ?? 'beleza1234'
const OUT = path.join(process.cwd(), 'docs', 'portfolio')

async function shot(
  page: import('@playwright/test').Page,
  file: string,
  fullPage = true
) {
  const dest = path.join(OUT, file)
  await page.screenshot({ path: dest, fullPage })
  console.log('ok', file)
}

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await Promise.all([
    page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ])
  if (page.url().includes('/onboarding')) {
    const skip = page.getByRole('button', { name: /pular/i })
    if (await skip.count()) {
      await skip.click()
      await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
    }
  }
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'pt-BR',
  })
  const page = await context.newPage()

  // 1) Landing
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '01-landing.png')

  // 2) Agendamento público — profissional / serviço / horário
  const landingHtml = await page.content()
  const slugMatch = landingHtml.match(/href="(\/p\/[^"]+)"/)
  const bookingPath = slugMatch?.[1] ?? '/p/mariana-oliveira-9a2145'
  await page.goto(`${BASE}${bookingPath}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  // tenta avançar um passo se o formulário tiver seleção clicável
  const firstService = page.locator('button, [role="button"], label').filter({
    hasText: /limpeza|design|manicure|serviço/i,
  }).first()
  if (await firstService.count()) {
    await firstService.click({ timeout: 3000 }).catch(() => undefined)
    await page.waitForTimeout(500)
  }
  await shot(page, '02-agendamento.png')

  // Login para telas internas
  await login(page)

  // 3) Dashboard
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '03-dashboard.png')

  // 4) Agenda
  await page.goto(`${BASE}/appointments`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '04-agenda.png')

  // 5) Clientes
  await page.goto(`${BASE}/clients`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '05-clientes.png')

  // Extra: detalhe do primeiro cliente (não /clients/new)
  const clientHrefs = await page
    .locator('a[href^="/clients/"]')
    .evaluateAll((els) =>
      els
        .map((el) => (el as HTMLAnchorElement).getAttribute('href') || '')
        .filter((h) => h && !h.endsWith('/new') && h !== '/clients')
    )
  if (clientHrefs[0]) {
    await page.goto(`${BASE}${clientHrefs[0]}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await shot(page, '05b-cliente-detalhe.png')
  }

  await browser.close()
  console.log(`Prints salvos em ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
