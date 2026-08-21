/**
 * Prepara ambiente local:
 * - cria .env com secrets
 * - sobe Postgres local via `prisma dev`
 * - prisma db push + seed
 */
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createConnection } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, execSync } from 'node:child_process'
import webpush from 'web-push'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const envPath = resolve(root, '.env')
const examplePath = resolve(root, '.env.example')

export const LOCAL_DB_NAME = 'clinica-de-beleza'

/** Fallback se ainda não soubermos a porta do `prisma dev`. */
export const LOCAL_DATABASE_URL_FALLBACK =
  'postgres://postgres:postgres@127.0.0.1:51214/template1' +
  '?sslmode=disable&connection_limit=10&connect_timeout=0' +
  '&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0'

const OWNER_EMAIL = 'mariana@clinica-mariana.local'
const OWNER_PASSWORD = 'beleza1234'

function withPoolParams(url) {
  if (!url) return url
  if (url.includes('connection_limit=')) return url
  const sep = url.includes('?') ? '&' : '?'
  return (
    url +
    `${sep}connection_limit=10&connect_timeout=0` +
    `&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0`
  )
}

function extractPostgresUrl(text) {
  if (!text) return null
  const match = text.match(
    /postgres(?:ql)?:\/\/postgres:postgres@[^\s"'<>]+/i
  )
  return match ? withPoolParams(match[0].replace(/[.,;]+$/, '')) : null
}

function isLocalPrismaUrl(url) {
  if (!url) return false
  return (
    url.includes('127.0.0.1:') ||
    url.includes('localhost:') ||
    url.startsWith('prisma+postgres://')
  )
}

function loadEnvFile(path) {
  if (!existsSync(path)) return {}
  const map = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    map[key] = value
  }
  return map
}

function serializeEnv(map) {
  const order = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'ENCRYPTION_MASTER_KEY',
    'BILLING_ENABLED',
    'DEMO_MODE',
    'DEMO_SESSION_HOURS',
    'DEMO_BYPASS_EMAILS',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'VAPID_SUBJECT',
    'CRON_SECRET',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'PLATFORM_OWNER_EMAILS',
    'BETA_ALLOWED_EMAILS',
  ]

  const lines = [
    '# Gerado por scripts/prepare-local.mjs — Clínica de Beleza Mariana Oliveira',
    '',
  ]

  const written = new Set()
  for (const key of order) {
    if (map[key] === undefined) continue
    written.add(key)
    lines.push(`${key}="${map[key]}"`)
  }
  for (const [key, value] of Object.entries(map)) {
    if (written.has(key)) continue
    lines.push(`${key}="${value}"`)
  }
  return lines.join('\n') + '\n'
}

function isPlaceholderDb(url) {
  if (!url) return true
  return (
    url.includes('[PROJECT_REF]') ||
    url.includes('[PASSWORD]') ||
    url.includes('generate-with-openssl') ||
    url.includes('SEU-PROJETO')
  )
}

function needsSecret(value) {
  return (
    !value ||
    value.includes('generate-with-openssl') ||
    value.includes('generate-new')
  )
}

export function ensureLocalEnv() {
  const existing = loadEnvFile(envPath)
  const example = loadEnvFile(examplePath)
  const map = { ...example, ...existing }

  // Remove restos de plataformas externas
  for (const key of Object.keys(map)) {
    if (
      key.includes('SUPABASE') ||
      key.includes('SENTRY') ||
      key.includes('VERCEL')
    ) {
      delete map[key]
    }
  }

  if (isPlaceholderDb(map.DATABASE_URL) || !isLocalPrismaUrl(map.DATABASE_URL)) {
    map.DATABASE_URL = LOCAL_DATABASE_URL_FALLBACK
  }

  const authSecret = needsSecret(map.AUTH_SECRET)
    ? randomBytes(32).toString('base64')
    : map.AUTH_SECRET
  map.AUTH_SECRET = authSecret
  if (needsSecret(map.NEXTAUTH_SECRET)) {
    map.NEXTAUTH_SECRET = authSecret
  }
  if (needsSecret(map.ENCRYPTION_MASTER_KEY)) {
    map.ENCRYPTION_MASTER_KEY = randomBytes(32).toString('base64')
  }
  if (needsSecret(map.CRON_SECRET)) {
    map.CRON_SECRET = randomBytes(32).toString('hex')
  }

  if (!map.NEXTAUTH_URL) {
    map.NEXTAUTH_URL = 'http://localhost:3000'
  }

  map.BILLING_ENABLED = map.BILLING_ENABLED || 'false'
  map.DEMO_MODE = map.DEMO_MODE || 'false'
  map.DEMO_SESSION_HOURS = map.DEMO_SESSION_HOURS || '2'
  map.DEMO_BYPASS_EMAILS = map.DEMO_BYPASS_EMAILS || OWNER_EMAIL
  map.PLATFORM_OWNER_EMAILS = map.PLATFORM_OWNER_EMAILS || OWNER_EMAIL
  map.BETA_ALLOWED_EMAILS =
    map.BETA_ALLOWED_EMAILS ||
    `${OWNER_EMAIL},camila@clinica-mariana.local,juliana@clinica-mariana.local`
  map.RESEND_FROM_EMAIL = map.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  map.VAPID_SUBJECT = map.VAPID_SUBJECT || `mailto:${OWNER_EMAIL}`

  if (!map.VAPID_PUBLIC_KEY || !map.VAPID_PRIVATE_KEY) {
    const vapid = webpush.generateVAPIDKeys()
    map.VAPID_PUBLIC_KEY = vapid.publicKey
    map.VAPID_PRIVATE_KEY = vapid.privateKey
  }

  writeFileSync(envPath, serializeEnv(map), 'utf8')

  for (const [key, value] of Object.entries(map)) {
    process.env[key] = value
  }

  return { useLocalDb: true, map }
}

function waitForUrl(url, timeoutMs = 90_000) {
  const parsed = new URL(url)
  const port = Number(parsed.port || 5432)
  const host = parsed.hostname || '127.0.0.1'
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const socket = createConnection({ port, host })
      socket.once('connect', () => {
        socket.end()
        resolve(true)
      })
      socket.once('error', () => {
        socket.destroy()
        if (Date.now() - started > timeoutMs) {
          reject(
            new Error(
              `Timeout esperando Postgres local em ${host}:${port}. ` +
                `Rode: npx prisma dev --name ${LOCAL_DB_NAME}`
            )
          )
          return
        }
        setTimeout(tryOnce, 500)
      })
    }
    tryOnce()
  })
}

async function canQueryPostgres(url) {
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: url })
  try {
    await client.connect()
    await client.query('SELECT 1')
    return true
  } catch {
    return false
  } finally {
    try {
      await client.end()
    } catch {
      // ignore
    }
  }
}

function isClinicDbRunning() {
  try {
    const ls = execSync('npx prisma dev ls', {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
    })
    const block = ls.split(/\r?\n/).find((line) => line.includes(LOCAL_DB_NAME))
    return Boolean(block && /running/i.test(block))
  } catch {
    return false
  }
}

function startPrismaDevPersistent() {
  // `--detach` no Windows às vezes sobe e morre; spawn detached mantém o processo.
  const child = spawn(
    'npx',
    ['prisma', 'dev', '--name', LOCAL_DB_NAME],
    {
      cwd: root,
      detached: true,
      stdio: 'ignore',
      shell: true,
      windowsHide: true,
      env: process.env,
    }
  )
  child.unref()
}

function readLocalDbUrlFromLs() {
  try {
    const ls = execSync('npx prisma dev ls', {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
    })
    return extractPostgresUrl(ls)
  } catch {
    return null
  }
}

function persistDatabaseUrl(url) {
  const map = loadEnvFile(envPath)
  map.DATABASE_URL = withPoolParams(url)
  writeFileSync(envPath, serializeEnv(map), 'utf8')
  process.env.DATABASE_URL = map.DATABASE_URL
  return map.DATABASE_URL
}

export async function ensureLocalPostgres() {
  const { map } = ensureLocalEnv()

  let dbUrl = extractPostgresUrl(map.DATABASE_URL) || readLocalDbUrlFromLs()

  if (dbUrl && isClinicDbRunning() && (await canQueryPostgres(dbUrl))) {
    console.log(`→ Postgres local já ativo.`)
    persistDatabaseUrl(dbUrl)
    return { useLocalDb: true }
  }

  if (isClinicDbRunning()) {
    try {
      execSync(`npx prisma dev stop ${LOCAL_DB_NAME}`, {
        cwd: root,
        stdio: 'ignore',
        env: process.env,
      })
    } catch {
      // ignore
    }
  }

  console.log(`→ Subindo Postgres local (prisma dev — ${LOCAL_DB_NAME})...`)
  startPrismaDevPersistent()

  const started = Date.now()
  while (Date.now() - started < 90_000) {
    dbUrl = readLocalDbUrlFromLs() || extractPostgresUrl(map.DATABASE_URL)
    if (dbUrl) {
      try {
        await waitForUrl(dbUrl, 2_000)
        if (await canQueryPostgres(dbUrl)) {
          persistDatabaseUrl(dbUrl)
          console.log(`→ DATABASE_URL local: ${dbUrl.split('?')[0]}`)
          return { useLocalDb: true }
        }
      } catch {
        // keep waiting
      }
    }
    await new Promise((r) => setTimeout(r, 1_000))
  }

  throw new Error(
    `Não foi possível subir o Postgres local (${LOCAL_DB_NAME}). ` +
      `Tente em outro terminal: npx prisma dev --name ${LOCAL_DB_NAME}`
  )
}

export function syncSchemaAndSeed(useLocalDb = true) {
  console.log('→ prisma generate...')
  execSync('npx prisma generate', { cwd: root, stdio: 'inherit', env: process.env })
  console.log('→ prisma db push...')
  const pushCmd = useLocalDb
    ? 'npx prisma db push --accept-data-loss'
    : 'npx prisma db push'
  execSync(pushCmd, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  console.log('→ seed clínica...')
  execSync('npx tsx scripts/seed-demo.mts', {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
}

export async function prepareLocal() {
  console.log('\n=== Clínica de Beleza Mariana Oliveira — preparação local ===\n')
  const { useLocalDb } = await ensureLocalPostgres()
  syncSchemaAndSeed(useLocalDb)
  console.log('\nPronto para desenvolver.')
  console.log(`Login: ${OWNER_EMAIL}`)
  console.log(`Senha: ${OWNER_PASSWORD}`)
  console.log('URL:   http://localhost:3000\n')
}

if (process.argv[1] && process.argv[1].endsWith('prepare-local.mjs')) {
  prepareLocal().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
