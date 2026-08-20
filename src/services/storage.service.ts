import { randomUUID } from 'crypto'
import { mkdir, writeFile, readFile, unlink } from 'fs/promises'
import path from 'path'
import { ERROR_CODES } from '@/lib/error-codes'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024
const STORAGE_ROOT = path.join(process.cwd(), 'storage')

/** Na Vercel o disco é efêmero — uploads locais não servem para demo em produção. */
function assertWritableStorage() {
  if (process.env.VERCEL === '1') {
    throw new Error(ERROR_CODES.UPLOAD_ERROR)
  }
}

function resolveSafePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const absolute = path.resolve(STORAGE_ROOT, normalized)
  if (!absolute.startsWith(path.resolve(STORAGE_ROOT))) {
    throw new Error(ERROR_CODES.UPLOAD_ERROR)
  }
  return absolute
}

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return ERROR_CODES.INVALID_FILE
  }
  if (file.size > MAX_FILE_SIZE) {
    return ERROR_CODES.FILE_TOO_LARGE
  }
  return null
}

export async function uploadToStorage(
  userId: string,
  clientId: string,
  file: File
): Promise<{ path: string }> {
  const validationError = validateFile(file)
  if (validationError) {
    throw new Error(validationError)
  }
  assertWritableStorage()

  const ext = file.name.split('.').pop() ?? 'bin'
  const relativePath = `${userId}/${clientId}/${Date.now()}-${randomUUID()}.${ext}`
  const absolute = resolveSafePath(relativePath)
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, Buffer.from(await file.arrayBuffer()))
  return { path: relativePath }
}

const SERVICE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SERVICE_PHOTO_SIZE = 5 * 1024 * 1024

export function validateServicePhoto(file: File): string | null {
  if (!SERVICE_IMAGE_TYPES.includes(file.type)) {
    return ERROR_CODES.INVALID_FILE
  }
  if (file.size > MAX_SERVICE_PHOTO_SIZE) {
    return ERROR_CODES.FILE_TOO_LARGE
  }
  return null
}

export async function uploadServicePhoto(
  userId: string,
  serviceId: string,
  file: File
): Promise<{ path: string }> {
  const validationError = validateServicePhoto(file)
  if (validationError) {
    throw new Error(validationError)
  }
  assertWritableStorage()

  const ext = file.name.split('.').pop() ?? 'jpg'
  const relativePath = `service-photos/${userId}/${serviceId}.${ext}`
  const absolute = resolveSafePath(relativePath)
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, Buffer.from(await file.arrayBuffer()))
  return { path: relativePath }
}

export async function getServicePhotoFromStorage(relativePath: string): Promise<{
  buffer: Buffer
  contentType: string
} | null> {
  try {
    const absolute = resolveSafePath(relativePath)
    const buffer = await readFile(absolute)
    const ext = relativePath.split('.').pop()?.toLowerCase()
    const contentType =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    return { buffer, contentType }
  } catch {
    return null
  }
}

export async function deleteFromStorage(relativePath: string): Promise<void> {
  try {
    const absolute = resolveSafePath(relativePath)
    await unlink(absolute)
  } catch {
    // arquivo já ausente
  }
}
