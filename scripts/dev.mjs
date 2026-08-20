/**
 * `npm run dev` — sobe Postgres local (se preciso), sincroniza schema, seed e Next.js.
 */
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareLocal } from './prepare-local.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

async function main() {
  await prepareLocal()

  console.log('→ next dev (localhost + rede local)\n')
  console.log('  Neste PC:     http://localhost:3000')
  console.log('  Outro aparelho na mesma Wi‑Fi: http://SEU_IP:3000')
  console.log('  (descubra o IP com: ipconfig → IPv4)\n')

  const child = spawn(
    'npx',
    ['next', 'dev', '--hostname', '0.0.0.0', '--port', '3000'],
    {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    }
  )

  const shutdown = (signal) => {
    if (child.pid) child.kill(signal)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  child.on('exit', (code) => process.exit(code ?? 0))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
