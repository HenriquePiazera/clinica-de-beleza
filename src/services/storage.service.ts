import { randomUUID } from 'crypto'
import { mkdir, writeFile, readFile, unlink } from 'fs/promises'
import path from 'path'
import { ERROR_CODES } from '@/lib/error-codes'
import {
  getSupabaseServiceClient,
  getSupabaseStorageBucket,
  isSupabaseStorageConfigured,
} from '@/lib/supabase-storage'

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

/**
 * Local na Vercel é efêmero. Com Supabase Storage configurado, uploads ok em produção.
 */
function assertWritableStorage() {
  if (process.env.VERCEL === '1' && !isSupabaseStorageConfigured()) {
    throw new Error(ERROR_CODES.UPLOAD_ERROR)
  }
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
}

function resolveSafePath(relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath)
  const absolute = path.resolve(STORAGE_ROOT, normalized)
  if (!absolute.startsWith(path.resolve(STORAGE_ROOT))) {
    throw new Error(ERROR_CODES.UPLOAD_ERROR)
  }
  return absolute
}

function contentTypeFromPath(relativePath: string, fallback = 'application/octet-stream') {
  const ext = relativePath.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'pdf') return 'application/pdf'
  return fallback
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

async function uploadBytes(
  relativePath: string,
  bytes: Buffer,
  contentType: string,
  upsert: boolean
): Promise<void> {
  const key = normalizeRelativePath(relativePath)

  if (isSupabaseStorageConfigured()) {
    const supabase = getSupabaseServiceClient()
    const bucket = getSupabaseStorageBucket()
    const { error } = await supabase.storage.from(bucket).upload(key, bytes, {
      contentType,
      upsert,
    })
    if (error) {
      console.error('[storage] supabase upload:', error.message)
      throw new Error(ERROR_CODES.UPLOAD_ERROR)
    }
    return
  }

  assertWritableStorage()
  const absolute = resolveSafePath(key)
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, bytes)
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
  const bytes = Buffer.from(await file.arrayBuffer())
  await uploadBytes(relativePath, bytes, file.type || 'application/octet-stream', false)
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
  const bytes = Buffer.from(await file.arrayBuffer())
  await uploadBytes(
    relativePath,
    bytes,
    file.type || 'image/jpeg',
    true
  )
  return { path: relativePath }
}

export async function getObjectFromStorage(relativePath: string): Promise<{
  buffer: Buffer
  contentType: string
} | null> {
  const key = normalizeRelativePath(relativePath)

  if (isSupabaseStorageConfigured()) {
    try {
      const supabase = getSupabaseServiceClient()
      const bucket = getSupabaseStorageBucket()
      const { data, error } = await supabase.storage.from(bucket).download(key)
      if (error || !data) return null
      const buffer = Buffer.from(await data.arrayBuffer())
      return {
        buffer,
        contentType: contentTypeFromPath(key, data.type || 'application/octet-stream'),
      }
    } catch (err) {
      console.error('[storage] supabase download:', err)
      return null
    }
  }

  try {
    const absolute = resolveSafePath(key)
    const buffer = await readFile(absolute)
    return { buffer, contentType: contentTypeFromPath(key) }
  } catch {
    return null
  }
}

export async function getServicePhotoFromStorage(relativePath: string): Promise<{
  buffer: Buffer
  contentType: string
} | null> {
  return getObjectFromStorage(relativePath)
}

export async function deleteFromStorage(relativePath: string): Promise<void> {
  const key = normalizeRelativePath(relativePath)

  if (isSupabaseStorageConfigured()) {
    try {
      const supabase = getSupabaseServiceClient()
      const bucket = getSupabaseStorageBucket()
      const { error } = await supabase.storage.from(bucket).remove([key])
      if (error) {
        console.error('[storage] supabase delete:', error.message)
      }
    } catch (err) {
      console.error('[storage] supabase delete:', err)
    }
    return
  }

  try {
    const absolute = resolveSafePath(key)
    await unlink(absolute)
  } catch {
    // arquivo já ausente
  }
}
