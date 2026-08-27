/**
 * Garante bucket privado clinic-files no Supabase Storage.
 * Uso (com vars no ambiente):
 *   $env:SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   npx tsx scripts/ensure-supabase-storage.mts
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL?.trim()
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'clinic-files'

if (!url || !key) {
  console.error(
    'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (Settings → API no Supabase).'
  )
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: buckets, error: listError } = await supabase.storage.listBuckets()
if (listError) {
  console.error('Falha ao listar buckets:', listError.message)
  process.exit(1)
}

const exists = buckets?.some((b) => b.name === bucket)
if (exists) {
  console.log(`Bucket "${bucket}" já existe.`)
} else {
  const { error } = await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  })
  if (error) {
    console.error('Falha ao criar bucket:', error.message)
    process.exit(1)
  }
  console.log(`Bucket privado "${bucket}" criado.`)
}

console.log('OK — use as mesmas vars na Vercel e faça redeploy.')
console.log('Health: GET /api/health → supabaseStorage: true')
