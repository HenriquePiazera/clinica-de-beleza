import { test, expect } from '@playwright/test'
import { futureUniqueSlot, loginAsOwner, setDatetimeLocal } from './helpers'

test.describe('fluxo operacional', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  test('cadastra cliente e abre a ficha', async ({ page }) => {
    const stamp = Date.now()
    const name = `Cliente E2E ${stamp}`

    await page.goto('/clients/new')
    await expect(page.getByRole('heading', { name: 'Novo cliente' })).toBeVisible()

    await page.locator('#name').fill(name)
    await page.locator('#phone').fill('11988887777')
    await page.locator('#email').fill(`e2e.${stamp}@example.com`)
    await page.getByRole('button', { name: 'Salvar cliente' }).click()

    await page.waitForURL(/\/clients\/[^/]+$/)
    await expect(page.getByText(name).first()).toBeVisible()
  })

  test('cria agendamento a partir da agenda', async ({ page }) => {
    await page.goto('/appointments')
    await expect(
      page.getByRole('heading', { name: /Agenda|Agendamentos/i })
    ).toBeVisible()

    await page.goto('/appointments/new')
    await expect(page.getByRole('heading', { name: 'Novo agendamento' })).toBeVisible()

    const clientSelect = page.locator('#client_id')
    await expect(clientSelect.locator('option')).not.toHaveCount(1)

    const firstClientValue = await clientSelect.locator('option').nth(1).getAttribute('value')
    expect(firstClientValue).toBeTruthy()
    await clientSelect.selectOption(firstClientValue!)

    const { start, end } = futureUniqueSlot()
    await setDatetimeLocal(page, '#start_time', start)
    await setDatetimeLocal(page, '#end_time', end)

    await page.getByRole('button', { name: 'Salvar agendamento' }).click()
    await page.waitForURL((url) => url.pathname === '/appointments')
    await expect(page).toHaveURL(/\/appointments/)
    await expect(page).not.toHaveURL(/error=1/)
  })

  test('abre configurações de serviços e horários', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()

    await page.getByRole('link', { name: 'Serviços' }).click()
    await expect(page).toHaveURL(/\/settings\/services/)

    await page.goto('/settings/availability')
    await expect(
      page.getByRole('heading', { name: /Horários/i })
    ).toBeVisible()

    await page.goto('/settings/team')
    await expect(page.getByRole('heading', { name: /Equipe/i })).toBeVisible()
  })
})
