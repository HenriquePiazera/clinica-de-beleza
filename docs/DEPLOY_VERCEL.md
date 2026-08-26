# Deploy na Vercel — Clínica de Beleza Mariana Oliveira

Checklist curto: [CHECKLIST_DEPLOY_CLIENTE.md](./CHECKLIST_DEPLOY_CLIENTE.md)

O app local usa `prisma dev`. Na Vercel isso **não existe** — use **Postgres Neon NOVO**.

**Nunca** reutilize `DATABASE_URL`, `ENCRYPTION_MASTER_KEY` ou `AUTH_SECRET` de outra demo.

Fotos de profissionais em `public/professionals/` sobem com o deploy (estáticas).  
Anexos: localmente usam pasta `storage/`; na Vercel configure **Supabase Storage** (opcional mas recomendado para portfólio).

---

## 0. Gerar segredos

```powershell
npm run deploy:secrets
```

Cole a saída nas env vars da Vercel. Modelo completo: `.env.production.example`.

---

## 1. Criar banco — Neon **ou** Supabase (projeto novo)

Qualquer Postgres gerenciado serve. O app usa só `DATABASE_URL` (Prisma).  
Storage de arquivos é separado (ver seção **Supabase Storage** abaixo).

### Opção A — Neon

1. https://neon.tech → **New project** (`clinica-mariana-oliveira`)
2. Connection string **pooled** (`-pooler`) com `?sslmode=require`

### Opção B — Supabase (se já tem conta)

1. https://supabase.com → **New project** (`clinica-mariana-oliveira`)
2. **Settings → Database → Connection string**
3. Para `db push` / seed no PC: use a URL **Direct** (porta `5432`) + `?sslmode=require`
4. Na Vercel (`DATABASE_URL`): use a URL **Transaction** pooler (porta `6543`) + `?sslmode=require`  
   (opcional, se der erro de prepared statement: `&pgbouncer=true`)

**Nunca** reutilize banco/segredos de outra demo.

---

## 1.1 Supabase Storage (anexos / fotos de serviço na Vercel)

Sem estas vars, upload na Vercel falha de propósito (disco efêmero). Com elas, anexos e fotos de serviço persistem.

1. No projeto Supabase → **Storage** → **New bucket**
2. Nome: `clinic-files` (ou o valor de `SUPABASE_STORAGE_BUCKET`)
3. Deixe o bucket **privado** (sem acesso público)
4. Em **Settings → API**, copie:
   - Project URL → `SUPABASE_URL`
   - `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY`  
   **Nunca** coloque `service_role` no frontend / `NEXT_PUBLIC_*`
5. Na Vercel, adicione:

| Variável | Valor |
|----------|--------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role |
| `SUPABASE_STORAGE_BUCKET` | `clinic-files` (opcional) |

Conferir: `GET /api/health` deve retornar `"supabaseStorage": true`.  
Download de anexos (logado): `/api/attachments/[id]`.

---

## 2. Schema + seed no Neon

```powershell
$env:DATABASE_URL="postgresql://...pooler-ou-direct...?sslmode=require"

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
| `DATABASE_URL` | Neon ou Supabase **novo** (pooled na Vercel) |
| `AUTH_SECRET` | `npm run deploy:secrets` |
| `NEXTAUTH_SECRET` | Igual a `AUTH_SECRET` |
| `NEXTAUTH_URL` | `https://SEU-PROJETO.vercel.app` (ajuste após 1º deploy) |
| `ENCRYPTION_MASTER_KEY` | Segredo **novo** |
| `BILLING_ENABLED` | `false` |
| `DEMO_MODE` | `false` |
| `MOCK_SMS_ENABLED` | `true` (SMS de teste na inbox; custo R$ 0) |
| `CRON_SECRET` | Segredo gerado |
| `PLATFORM_OWNER_EMAILS` | `mariana@clinica-mariana.local` |
| `BETA_ALLOWED_EMAILS` | e-mails das 3 profissionais (seed) |
| `DEMO_BYPASS_EMAILS` | `mariana@clinica-mariana.local` |
| `RESEND_*` / `VAPID_*` | Opcional no 1º teste; configure para e-mail/push |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Opcional; necessário para anexos na Vercel |

Com `MOCK_SMS_ENABLED=true`, cada notificação com telefone também grava na caixa **Configurações → Notificações → SMS de teste** (mesmo se o e-mail enviar).

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
