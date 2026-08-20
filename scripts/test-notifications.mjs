import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import webpush from 'web-push'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')

function loadEnv() {
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
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
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnv()

const emailArg = process.argv.find((a) => a.startsWith('--email='))
const testEmail = emailArg?.slice('--email='.length)

console.log('\nTeste de notificações\n')

const vapidPublic = process.env.VAPID_PUBLIC_KEY?.trim()
const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim()
const vapidSubject = process.env.VAPID_SUBJECT?.trim()

if (vapidPublic && vapidPrivate && vapidSubject) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
    console.log('✓ VAPID configurado (push PWA pronto no servidor)')
    console.log(`  Subject: ${vapidSubject}`)
  } catch (err) {
    console.log('❌ VAPID inválido:', err.message)
  }
} else {
  console.log('❌ VAPID incompleto — rode: npm run setup:notifications')
}

const resendKey = process.env.RESEND_API_KEY?.trim()
const resendFrom = process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev'

if (!resendKey || resendKey.includes('placeholder')) {
  console.log('⚠️  Resend não configurado (RESEND_API_KEY placeholder ou vazio)')
} else if (testEmail) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Demo Assistente Administrativo <${resendFrom}>`,
      to: [testEmail],
      subject: 'Teste Demo Assistente Administrativo — Resend OK',
      html: '<p>Se você recebeu este e-mail, o Resend está funcionando.</p>',
    }),
  })
  if (response.ok) {
    console.log(`✓ E-mail de teste enviado para ${testEmail}`)
  } else {
    console.log(`❌ Falha ao enviar e-mail: ${response.status} ${await response.text()}`)
  }
} else {
  console.log('✓ RESEND_API_KEY presente')
  console.log('  Para testar envio: npm run test:notifications -- --email=seu@email.com')
}

console.log('')
