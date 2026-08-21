/**
 * Grava RESEND_API_KEY (e opcionalmente RESEND_FROM_EMAIL) no .env.
 *
 * Uso:
 *   npm run configure:resend -- --key=re_xxxxxxxx
 *   npm run configure:resend -- --key=re_xxxxxxxx --from=onboarding@resend.dev
 *
 * Depois: reinicie `npm run dev` e teste:
 *   npm run test:notifications -- --email=seu@email.com
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')
const examplePath = resolve(root, '.env.example')

function quoteValue(value) {
  return `"${value.replace(/"/g, '\\"')}"`
}

function upsertEnvKey(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm')
  const line = `${key}=${quoteValue(value)}`
  if (regex.test(content)) return content.replace(regex, line)
  return `${content.trimEnd()}\n${line}\n`
}

function argValue(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length).trim() : null
}

const key = argValue('key') || process.env.RESEND_API_KEY?.trim()
const from =
  argValue('from') ||
  process.env.RESEND_FROM_EMAIL?.trim() ||
  'onboarding@resend.dev'

if (!key || !key.startsWith('re_')) {
  console.error(`
RESEND_API_KEY ausente ou inválida.

1. Conta em https://resend.com (plano free basta)
2. API Keys → Create API Key (permissão Sending access)
3. Rode:

   npm run configure:resend -- --key=re_SUA_CHAVE

Opcional (domínio verificado no Resend):

   npm run configure:resend -- --key=re_SUA_CHAVE --from=agenda@seudominio.com.br

Sem domínio verificado, use o remetente de teste:

   --from=onboarding@resend.dev

Com free + onboarding@resend.dev, o Resend só entrega para o e-mail da sua conta.
`)
  process.exit(1)
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

let content = readFileSync(envPath, 'utf8')
content = upsertEnvKey(content, 'RESEND_API_KEY', key)
content = upsertEnvKey(content, 'RESEND_FROM_EMAIL', from)
writeFileSync(envPath, content, 'utf8')

console.log('\n✓ Resend gravado no .env')
console.log(`  RESEND_API_KEY  (len=${key.length})`)
console.log(`  RESEND_FROM_EMAIL=${from}`)
console.log('\nPróximos passos:')
console.log('  1. Reinicie npm run dev')
console.log('  2. npm run test:notifications -- --email=seu@email.com')
console.log('  3. Em produção (Vercel): mesma RESEND_API_KEY + RESEND_FROM_EMAIL\n')
