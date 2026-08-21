import { type Page, expect } from '@playwright/test'

export const E2E_USER = {
  email: process.env.E2E_EMAIL ?? 'mariana@clinica-mariana.local',
  password: process.env.E2E_PASSWORD ?? 'beleza1234',
}

/** Login pela página /login e espera o dashboard. */
export async function loginAsOwner(page: Page) {
  await page.goto('/login')
  await page.locator('#email').fill(E2E_USER.email)
  await page.locator('#password').fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
  await expect(
    page.getByText(/Dashboard gerencial|Olá,/i).first()
  ).toBeVisible({ timeout: 30_000 })
}

/** Slot futuro único (evita conflito com seed e com runs anteriores do E2E). */
export function futureUniqueSlot() {
  const start = new Date()
  start.setDate(start.getDate() + 3)
  const minuteOffset = Date.now() % (8 * 60)
  start.setHours(9, 0, 0, 0)
  start.setMinutes(minuteOffset)

  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const pad = (n: number) => String(n).padStart(2, '0')
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

  return { start: toLocal(start), end: toLocal(end) }
}

export async function setDatetimeLocal(
  page: Page,
  selector: string,
  value: string
) {
  await page.locator(selector).evaluate((el, v) => {
    const input = el as HTMLInputElement
    input.value = v
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}
