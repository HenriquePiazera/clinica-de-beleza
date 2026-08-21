# Deploy na Vercel — Clínica de Beleza Mariana Oliveira

Checklist curto: [CHECKLIST_DEPLOY_CLIENTE.md](./CHECKLIST_DEPLOY_CLIENTE.md)

O app local usa `prisma dev`. Na Vercel isso **não existe** — use **Postgres Neon NOVO**.

**Nunca** reutilize `DATABASE_URL`, `ENCRYPTION_MASTER_KEY` ou `AUTH_SECRET` de outra demo.

Fotos de profissionais em `public/professionals/` sobem com o deploy (estáticas). Upload de anexos no filesystem da Vercel **não persiste** (fora do escopo).

---

## 0. Gerar segredos

```powershell
npm run deploy:secrets
```

Cole a saída nas env vars da Vercel. Modelo completo: `.env.production.example`.

---

## 1. Criar banco (Neon) — projeto novo

1. https://neon.tech → **New project** (`clinica-mariana-oliveira`)
2. Connection string **pooled** (`-pooler`) com `?sslmode=require`

---

## 2. Schema + seed no Neon

```powershell
$env:DATABASE_URL="postgresql://...neon-pooler...?sslmode=require"

npx prisma db push
npx tsx scripts/seed-demo.mts
```

| Quem | E-mail | Senha |
|------|--------|-------|
| Mariana | `mariana@clinica-mariana.local` | `beleza1234` |
| Camila | `camila@clinica-mariana.local` | `beleza1234` |
| Juliana | `juliana@clinica-mariana.local` | `beleza1234` |

---

## 3. GitHub → Vercel

1. Push do repo `HenriquePiazera/clinica-de-beleza`
2. Vercel → **Add New Project** → importar o repo
3. Framework: **Next.js** · Node.js **22.x**
4. Env vars (Production) — ver tabela abaixo
5. **Deploy**

O arquivo `vercel.json` já define região `gru1` e cron horário em `/api/cron/reminders`.

### Variáveis (Production)

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | Neon **novo** (pooled) |
| `AUTH_SECRET` | `npm run deploy:secrets` |
| `NEXTAUTH_SECRET` | Igual a `AUTH_SECRET` |
| `NEXTAUTH_URL` | `https://SEU-PROJETO.vercel.app` (ajuste após 1º deploy) |
| `ENCRYPTION_MASTER_KEY` | Segredo **novo** |
| `BILLING_ENABLED` | `false` |
| `DEMO_MODE` | `false` |
| `CRON_SECRET` | Segredo gerado |
| `PLATFORM_OWNER_EMAILS` | `mariana@clinica-mariana.local` |
| `BETA_ALLOWED_EMAILS` | e-mails das 3 profissionais (seed) |
| `DEMO_BYPASS_EMAILS` | `mariana@clinica-mariana.local` |
| `RESEND_*` / `VAPID_*` | Opcional no 1º teste; configure para e-mail/push |

---

## 4. Domínio (quando tiver)

Vercel → Domains → DNS → atualizar `NEXTAUTH_URL` → redeploy.

---

## 5. Validar e enviar ao cliente

- [ ] Landing `/` com equipe e fotos
- [ ] Agendar atendimento
- [ ] Login Mariana / Camila / Juliana
- [ ] `DEMO_MODE=false`

Texto modelo na checklist.

---

## Problemas comuns

| Sintoma | Causa |
|---------|--------|
| Erro de banco | `DATABASE_URL` errada ou sem `db push` |
| Loop no login | `NEXTAUTH_URL` ≠ URL real |
| Demo expirada | `DEMO_MODE=true` — use `false` |
| Cron não roda | Plano Vercel / `CRON_SECRET` |
