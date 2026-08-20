/**
 * Gera chaves VAPID e preenche .env (sem sobrescrever valores existentes).
 * Resend: cole RESEND_API_KEY de https://resend.com/api-keys
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import webpush from 'web-push'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')
const examplePath = resolve(root, '.env.example')

function parseEnv(content) {
  const lines = content.split('\n')
  const map = new Map()
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    map.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim())
  }
  return { lines, map }
}

function quoteValue(value) {
  if (value.includes(' ') || value.includes('#')) {
    return `"${value.replace(/"/g, '\\"')}"`
  }
  return `"${value}"`
}

function upsertEnvKey(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm')
  const line = `${key}=${quoteValue(value)}`
  if (regex.test(content)) {
    return content.replace(regex, line)
  }
  return `${content.trimEnd()}\n${line}\n`
}

function isEmptyEnvValue(raw) {
  if (!raw) return true
  const unquoted = raw.replace(/^["']|["']$/g, '')
  return unquoted.length === 0
}

function getPlatformEmail(envContent) {
  const match = envContent.match(/^PLATFORM_OWNER_EMAILS=(.*)$/m)
  if (!match) return 'mailto:seu@email.com'
  const email = match[1].replace(/^["']|["']$/g, '').split(',')[0]?.trim()
  if (email && email.includes('@')) {
    return email.startsWith('mailto:') ? email : `mailto:${email}`
  }
  return 'mailto:seu@email.com'
}

if (!existsSync(envPath)) {
  if (existsSync(examplePath)) {
    writeFileSync(envPath, readFileSync(examplePath, 'utf8'), 'utf8')
    console.log('.env criado a partir de .env.example')
  } else {
    console.error('Arquivo .env não encontrado.')
    process.exit(1)
  }
}

let envContent = readFileSync(envPath, 'utf8')
const { map } = parseEnv(envContent)

const vapidKeys = webpush.generateVAPIDKeys()
const subject = getPlatformEmail(envContent)

const updates = []

if (isEmptyEnvValue(map.get('VAPID_PUBLIC_KEY'))) {
  envContent = upsertEnvKey(envContent, 'VAPID_PUBLIC_KEY', vapidKeys.publicKey)
  updates.push('VAPID_PUBLIC_KEY')
}

if (isEmptyEnvValue(map.get('VAPID_PRIVATE_KEY'))) {
  envContent = upsertEnvKey(envContent, 'VAPID_PRIVATE_KEY', vapidKeys.privateKey)
  updates.push('VAPID_PRIVATE_KEY')
}

const currentSubject = map.get('VAPID_SUBJECT')
if (
  isEmptyEnvValue(currentSubject) ||
  currentSubject?.includes('seu@email.com')
) {
  envContent = upsertEnvKey(envContent, 'VAPID_SUBJECT', subject)
  updates.push('VAPID_SUBJECT')
}

if (!map.has('BILLING_ENABLED')) {
  envContent = upsertEnvKey(envContent, 'BILLING_ENABLED', 'false')
  updates.push('BILLING_ENABLED')
}

if (isEmptyEnvValue(map.get('RESEND_FROM_EMAIL'))) {
  envContent = upsertEnvKey(envContent, 'RESEND_FROM_EMAIL', 'onboarding@resend.dev')
  updates.push('RESEND_FROM_EMAIL')
}

writeFileSync(envPath, envContent, 'utf8')

console.log('\nSetup de notificações (Push PWA + Resend)\n')

if (updates.length > 0) {
  console.log('Variáveis atualizadas no .env:')
  for (const key of updates) console.log(`  ✓ ${key}`)
} else {
  console.log('Chaves VAPID já configuradas — nada alterado.')
}

const resendKey = map.get('RESEND_API_KEY')?.replace(/^["']|["']$/g, '') ?? ''
if (!resendKey || resendKey.includes('placeholder')) {
  console.log('\n⚠️  RESEND_API_KEY ainda não configurada.')
  console.log('   1. Crie conta em https://resend.com')
  console.log('   2. API Keys → Create API Key')
  console.log('   3. Cole em .env: RESEND_API_KEY="re_..."')
  console.log('   4. Teste: npm run test:notifications -- --email seu@email.com')
} else {
  console.log('\n✓ RESEND_API_KEY presente')
}

console.log('\nPush PWA: npm run dev → acesse /p/[slug] e ative notificações')
console.log('Validar: npm run validate:env\n')
