import { describe, expect, it, vi } from 'vitest'
import { ERROR_CODES, getErrorMessage } from '@/lib/error-codes'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/demo', () => ({
  assertDemoAccessAllowed: vi.fn(async () => true),
  getDemoSessionHours: vi.fn(() => 2),
  isDemoMode: vi.fn(() => false),
}))

describe('ERROR_CODES', () => {
  it('expõe mensagens em português sem stack técnica', () => {
    expect(ERROR_CODES.UNAUTHORIZED).toMatch(/Sessão/)
    expect(ERROR_CODES.APPOINTMENT_CONFLICT).toMatch(/agendamento/)
    expect(ERROR_CODES.INVALID_INPUT).toMatch(/Dados inválidos/)
    expect(getErrorMessage('CLIENT_NOT_FOUND')).toBe(ERROR_CODES.CLIENT_NOT_FOUND)
  })

  it('actionError retorna ActionResult padronizado', async () => {
    const { actionError } = await import('@/lib/session')
    const result = actionError('PAYMENT_NOT_FOUND')
    expect(result).toEqual({
      success: false,
      error: ERROR_CODES.PAYMENT_NOT_FOUND,
      errorCode: 'PAYMENT_NOT_FOUND',
    })
  })
})
