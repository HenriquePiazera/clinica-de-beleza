import { describe, expect, it } from 'vitest'
import { appointmentSchema } from '@/schemas/appointment.schema'
import { availabilitySchema } from '@/schemas/availability.schema'
import { loginSchema, registerSchema } from '@/schemas/auth.schema'
import { clientSchema } from '@/schemas/client.schema'
import { serviceSchema } from '@/schemas/service.schema'

describe('clientSchema', () => {
  it('aceita cliente válido', () => {
    const result = clientSchema.safeParse({
      name: 'Ana Souza',
      phone: '11999990001',
      email: 'ana@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome curto e telefone inválido', () => {
    const result = clientSchema.safeParse({
      name: 'A',
      phone: '123',
    })
    expect(result.success).toBe(false)
  })
})

describe('auth schemas', () => {
  it('register exige senha com 8+ caracteres', () => {
    expect(
      registerSchema.safeParse({
        name: 'Mariana',
        email: 'mariana@example.com',
        password: 'curta',
      }).success
    ).toBe(false)

    expect(
      registerSchema.safeParse({
        name: 'Mariana',
        email: 'mariana@example.com',
        password: 'beleza1234',
      }).success
    ).toBe(true)
  })

  it('login exige e-mail e senha', () => {
    expect(
      loginSchema.safeParse({ email: 'x', password: '' }).success
    ).toBe(false)
    expect(
      loginSchema.safeParse({
        email: 'mariana@example.com',
        password: 'beleza1234',
      }).success
    ).toBe(true)
  })
})

describe('serviceSchema', () => {
  it('aceita serviços da clínica com preço', () => {
    const result = serviceSchema.safeParse({
      name: 'Limpeza de pele',
      duration_minutes: 60,
      price: 120,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita duração abaixo de 15 minutos', () => {
    const result = serviceSchema.safeParse({
      name: 'Rápido',
      duration_minutes: 5,
    })
    expect(result.success).toBe(false)
  })
})

describe('appointmentSchema', () => {
  it('aceita agendamento mínimo válido', () => {
    const result = appointmentSchema.safeParse({
      client_id: 'client-1',
      start_time: '2026-08-21T10:00:00.000Z',
      end_time: '2026-08-21T11:00:00.000Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.buffer_minutes).toBe(0)
    }
  })
})

describe('availabilitySchema', () => {
  it('aceita bloco segunda 09:00–18:00', () => {
    const result = availabilitySchema.safeParse({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '18:00',
      is_active: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita fim antes do início', () => {
    const result = availabilitySchema.safeParse({
      day_of_week: 2,
      start_time: '17:00',
      end_time: '09:00',
    })
    expect(result.success).toBe(false)
  })
})
