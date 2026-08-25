/**
 * Gera segredos para colar na Vercel (não grava em arquivo).
 * Uso: npm run deploy:secrets
 */
import { randomBytes } from 'node:crypto'

const auth = randomBytes(32).toString('base64')
const encryption = randomBytes(32).toString('base64')
const cron = randomBytes(32).toString('hex')

console.log(`
=== Segredos para Vercel (Production) — Clínica Mariana Oliveira ===
NÃO reutilize valores de outro projeto / demo.

AUTH_SECRET=${auth}
NEXTAUTH_SECRET=${auth}
ENCRYPTION_MASTER_KEY=${encryption}
CRON_SECRET=${cron}

BILLING_ENABLED=false
DEMO_MODE=false
MOCK_SMS_ENABLED=true

PLATFORM_OWNER_EMAILS=mariana@clinica-mariana.local
BETA_ALLOWED_EMAILS=mariana@clinica-mariana.local,camila@clinica-mariana.local,juliana@clinica-mariana.local
DEMO_BYPASS_EMAILS=mariana@clinica-mariana.local

# Depois do 1º deploy, ajuste NEXTAUTH_URL para a URL real:
# NEXTAUTH_URL=https://seu-projeto.vercel.app

# DATABASE_URL = connection string pooled do Neon NOVO
`)
