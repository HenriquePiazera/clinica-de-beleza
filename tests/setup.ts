import { randomBytes } from 'node:crypto'

process.env.ENCRYPTION_MASTER_KEY =
  process.env.ENCRYPTION_MASTER_KEY || randomBytes(32).toString('base64')
process.env.BILLING_ENABLED = process.env.BILLING_ENABLED || 'false'
process.env.DEMO_MODE = process.env.DEMO_MODE || 'false'
