import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_BUCKET = 'clinic-files'

export function isSupabaseStorageConfigured(): boolean {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  return Boolean(
    url &&
      key &&
      !url.includes('placeholder') &&
      !key.includes('placeholder')
  )
}

export function getSupabaseStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET
}

/** Client server-side com service role (nunca expor no browser). */
export function getSupabaseServiceClient(): SupabaseClient {
  if (!isSupabaseStorageConfigured()) {
    throw new Error('Supabase Storage não configurado')
  }
  return createClient(
    process.env.SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
