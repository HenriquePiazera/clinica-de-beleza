# Demo Assistente Administrativo

Sistema de agenda e atendimento para clínicas, salões e profissionais.

## Começar

```bash
npm install
npm run dev
```

Isso sobe Postgres local (`prisma dev`), aplica schema, cria seed e abre
http://localhost:3000 — sem serviços externos de deploy.

### Login

| Campo | Valor |
|-------|--------|
| E-mail | `demo@assistente-admin.local` |
| Senha | `demo1234` |

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Prepara tudo + Next.js |
| `npm run setup` | Só prepara (env, banco local, seed) |
| `npm run dev:next` | Só Next (banco já rodando) |
| `npm run db:seed` | Seed da conta demo |
| `npm run demo:link` | Link de 2h (se `DEMO_MODE=true`) |

## Acessar pelo celular / outro PC (mesmo Wi‑Fi)

1. No computador, rode `npm run dev`
2. Descubra o IP local:
   - PowerShell: `ipconfig` → procure **IPv4** (ex.: `10.0.0.105`)
3. No celular/outro aparelho, abra: `http://10.0.0.105:3000` (use o seu IP)
4. Se o login falhar pelo IP, no `.env` temporariamente:
   ```
   NEXTAUTH_URL="http://10.0.0.105:3000"
   ```
   Reinicie o `npm run dev`.

PC e celular precisam estar na **mesma rede Wi‑Fi**. Firewall do Windows pode pedir permissão na primeira vez — permita.

## Deploy na Vercel (link público para clientes)

Passo a passo completo: [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)

Resumo: banco Postgres na nuvem (Neon gratuito) → `prisma db push` + seed → importar o repo na Vercel → variáveis de ambiente → gerar link com `npm run demo:link`.
