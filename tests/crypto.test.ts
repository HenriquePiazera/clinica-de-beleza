import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  decryptField,
  encryptField,
  generateEncryptedDek,
} from '@/lib/crypto'

const users = new Map<string, { encrypted_dek: string }>()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirstOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => {
        const user = users.get(where.id)
        if (!user) throw new Error('User not found')
        return user
      }),
    },
  },
}))

describe('crypto (isolamento por usuário)', () => {
  beforeEach(() => {
    users.clear()
  })

  it('cifra e decifra para o mesmo usuário', async () => {
    const userId = 'user-mariana'
    users.set(userId, { encrypted_dek: generateEncryptedDek() })

    const plain = 'Evolução clínica — teste'
    const cipher = await encryptField(plain, userId)
    expect(cipher).not.toContain(plain)
    await expect(decryptField(cipher, userId)).resolves.toBe(plain)
  })

  it('impede outro usuário de decifrar o payload', async () => {
    const user1 = 'user-1'
    const user2 = 'user-2'
    users.set(user1, { encrypted_dek: generateEncryptedDek() })
    users.set(user2, { encrypted_dek: generateEncryptedDek() })

    const cipher = await encryptField('dado sensível', user1)
    await expect(decryptField(cipher, user2)).rejects.toThrow()
  })
})
