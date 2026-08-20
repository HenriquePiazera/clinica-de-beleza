import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { prisma } from '@/lib/prisma'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getMasterKey(): Buffer {
  const key = process.env.ENCRYPTION_MASTER_KEY
  if (!key) {
    throw new Error('ENCRYPTION_MASTER_KEY não configurada no ambiente.')
  }
  const buffer = Buffer.from(key, 'base64')
  if (buffer.length !== 32) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY deve ter 32 bytes (256 bits) em base64.'
    )
  }
  return buffer
}

function encryptWithKey(plainText: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

function decryptWithKey(payload: string, key: Buffer): string {
  const buffer = Buffer.from(payload, 'base64')
  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

export function generateEncryptedDek(): string {
  const dek = randomBytes(32)
  const kek = getMasterKey()
  return encryptWithKey(dek.toString('base64'), kek)
}

function decryptDek(encryptedDek: string): Buffer {
  const kek = getMasterKey()
  const dekBase64 = decryptWithKey(encryptedDek, kek)
  return Buffer.from(dekBase64, 'base64')
}

export async function encryptField(
  plainText: string,
  userId: string
): Promise<string> {
  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId },
    select: { encrypted_dek: true },
  })
  const dek = decryptDek(user.encrypted_dek)
  return encryptWithKey(plainText, dek)
}

export async function decryptField(
  cipherText: string,
  userId: string
): Promise<string> {
  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId },
    select: { encrypted_dek: true },
  })
  const dek = decryptDek(user.encrypted_dek)
  return decryptWithKey(cipherText, dek)
}
