# Deploy na Vercel (link para clientes testarem)

O app local usa `prisma dev`. Na Vercel isso **não existe** — é obrigatório um **Postgres na nuvem**.

Recomendação simples e gratuita: [Neon](https://neon.tech) (só banco).  
Alternativa: [Supabase](https://supabase.com) (Postgres; storage opcional depois).

Upload de arquivos **não persiste** no filesystem da Vercel nesta demo. Clientes, agenda, atendimento e financeiro funcionam; anexos/fotos de serviço podem falhar até haver storage em nuvem.

---

## 1. Criar banco (Neon)

1. Conta em https://neon.tech → **New project**
2. Copie a connection string (**pooled** / `-pooler` se existir)
3. Formato típico:
   ```
   postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

---

## 2. Aplicar schema + seed no banco da nuvem

No PC, na pasta do projeto (PowerShell):

```powershell
# Use a URL do Neon (não a do prisma local)
$env:DATABASE_URL="postgresql://..."

npx prisma db push
npx tsx scripts/seed-demo.mts
```

Login seed: `demo@assistente-admin.local` / `demo1234`

---

## 3. Gerar segredos

```powershell
openssl rand -base64 32
```

Rode **3 vezes** (ou use valores diferentes) para:

- `AUTH_SECRET` / `NEXTAUTH_SECRET` (podem ser iguais)
- `ENCRYPTION_MASTER_KEY`
- `CRON_SECRET` (opcional nesta demo)

---

## 4. Conectar o GitHub na Vercel

1. https://vercel.com → **Add New Project**
2. Importe `HenriquePiazera/demo-assistente-administrativo`
3. Framework: **Next.js** (automático). Em **Node.js Version**, use **22.x** (o `package.json` exige `>=22`).
4. **Não** use o `.env` local — configure as variáveis abaixo no painel

### Variáveis de ambiente (Production)

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | Connection string do Neon |
| `AUTH_SECRET` | Segredo gerado |
| `NEXTAUTH_SECRET` | Mesmo de `AUTH_SECRET` |
| `NEXTAUTH_URL` | `https://SEU-PROJETO.vercel.app` (ajuste após o 1º deploy se a URL mudar) |
| `ENCRYPTION_MASTER_KEY` | Segredo gerado |
| `BILLING_ENABLED` | `false` |
| `DEMO_MODE` | `true` |
| `DEMO_SESSION_HOURS` | `2` |
| `DEMO_BYPASS_EMAILS` | `demo@assistente-admin.local` |
| `PLATFORM_OWNER_EMAILS` | `demo@assistente-admin.local` |
| `BETA_ALLOWED_EMAILS` | `demo@assistente-admin.local` |
| `CRON_SECRET` | Segredo gerado |

Depois do primeiro deploy, confira a URL real (ex.: `https://demo-assistente-administrativo.vercel.app`) e atualize `NEXTAUTH_URL` se necessário; redeploy.

5. **Deploy**

---

## 5. Link de 2h para o cliente

Com `DEMO_MODE=true`, o cliente entra por `/demo/<token>` (primeira visita inicia a janela de 2h).

Gerar o link **apontando para o banco de produção**:

```powershell
$env:DATABASE_URL="postgresql://...neon..."
$env:NEXTAUTH_URL="https://SEU-PROJETO.vercel.app"
$env:DEMO_SESSION_HOURS="2"

npm run demo:link -- "cliente-clinica-x"
```

Envie ao cliente a URL impressa, por exemplo:

`https://SEU-PROJETO.vercel.app/demo/abc123...`

Conta para explorar (se bypass/login direto):  
`demo@assistente-admin.local` / `demo1234`

---

## 6. Checklist rápido

- [ ] `prisma db push` + seed no Neon
- [ ] Env vars na Vercel
- [ ] Deploy verde
- [ ] Abrir a URL → landing → login ou link `/demo/...`
- [ ] Criar um cliente e um agendamento de teste

---

## Problemas comuns

| Sintoma | Causa provável |
|---------|----------------|
| Erro de banco / Prisma | `DATABASE_URL` errada ou schema não aplicado |
| Login redireciona em loop | `NEXTAUTH_URL` diferente da URL real |
| “Sessão de demo expirada” | Link de 2h esgotado — gere outro com `npm run demo:link` |
| Upload de arquivo falha | Esperado nesta demo na Vercel (sem storage em nuvem) |
