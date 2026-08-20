import { randomBytes } from 'node:crypto'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import webpush from 'web-push'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
const examplePath = resolve(__dirname, '..', '.env.example')

const authSecret = randomBytes(32).toString('base64')
const encryptionKey = randomBytes(32).toString('base64')
const cronSecret = randomBytes(32).toString('hex')
const vapidKeys = webpush.generateVAPIDKeys()

let template = readFileSync(examplePath, 'utf8')
  .replace(/generate-with-openssl-rand-base64-32/g, authSecret)
  .replace(/generate-with-openssl-rand-hex-32/g, cronSecret)
  .replace(
    /ENCRYPTION_MASTER_KEY="[^"]*"/,
    `ENCRYPTION_MASTER_KEY="${encryptionKey}"`
  )
  .replace(/VAPID_PUBLIC_KEY=""/, `VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`)
  .replace(/VAPID_PRIVATE_KEY=""/, `VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`)

if (!existsSync(envPath)) {
  writeFileSync(envPath, template, 'utf8')
  console.log('.env criado com secrets e chaves VAPID gerados.')
} else {
  console.log('.env já existe — rode npm run setup:notifications para VAPID.')
}

console.log('Consulte docs/SETUP_NOTIFICATIONS.md para Resend (e-mail).')
