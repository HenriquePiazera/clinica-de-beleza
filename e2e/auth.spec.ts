import { test, expect } from '@playwright/test'
import { E2E_USER, loginAsOwner } from './helpers'

test.describe('autenticação', () => {
  test('login com conta seed leva ao dashboard', async ({ page }) => {
    await loginAsOwner(page)
    await expect(page.getByText('Dashboard gerencial')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver clientes' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver agenda' })).toBeVisible()
  })

  test('credenciais inválidas permanecem no login', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill(E2E_USER.email)
    await page.locator('#password').fill('senha-errada-xyz')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/E-mail ou senha incorretos/i)).toBeVisible()
  })
})
