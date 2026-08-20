import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.ts'
import {
  generateEncryptedDek,
  encryptField,
  decryptField,
} from '../src/lib/crypto.ts'

async function runCryptoTest() {
  const passwordHash = await bcrypt.hash('test-password', 12)
  const dek1 = generateEncryptedDek()
  const dek2 = generateEncryptedDek()

  const user1 = await prisma.user.create({
    data: {
      name: 'Profissional Um',
      email: `test-user-1-${Date.now()}@example.com`,
      password_hash: passwordHash,
      encrypted_dek: dek1,
      plan: 'trial',
      plan_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Profissional Dois',
      email: `test-user-2-${Date.now()}@example.com`,
      password_hash: passwordHash,
      encrypted_dek: dek2,
      plan: 'trial',
      plan_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })

  const secret = 'Dado sensível de teste — evolução clínica'
  const encryptedForUser1 = await encryptField(secret, user1.id)
  const decryptedByUser1 = await decryptField(encryptedForUser1, user1.id)

  if (decryptedByUser1 !== secret) {
    throw new Error('Falha: decrypt do próprio usuário não retornou o texto original.')
  }

  let crossDecryptFailed = false
  try {
    await decryptField(encryptedForUser1, user2.id)
  } catch {
    crossDecryptFailed = true
  }

  if (!crossDecryptFailed) {
    throw new Error(
      'Falha de segurança: usuário 2 conseguiu decifrar dados do usuário 1.'
    )
  }

  await prisma.user.deleteMany({
    where: { id: { in: [user1.id, user2.id] } },
  })

  console.log('Teste de criptografia OK:')
  console.log('- encrypt/decrypt ida e volta para usuário 1')
  console.log('- usuário 2 NÃO decifra dados do usuário 1')
}

runCryptoTest()
  .catch((error) => {
    console.error('Teste de criptografia falhou:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
