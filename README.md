# Clínica de Beleza Mariana Oliveira

Sistema de agenda e atendimento da clínica (estética, beleza e bem-estar).

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/SISTEMA.md](docs/SISTEMA.md) | **Documentação completa do sistema** (uso + arquitetura) |
| [docs/ENTREGA_CLIENTE.md](docs/ENTREGA_CLIENTE.md) | Escopo comercial e entrega |
| [docs/CHECKLIST_DEPLOY_CLIENTE.md](docs/CHECKLIST_DEPLOY_CLIENTE.md) | Checklist de publicação |
| [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) | Deploy Vercel + Neon |

## Começar

```bash
npm install
npm run dev
```

Isso sobe Postgres local (`prisma dev`), aplica schema, cria seed e abre
http://localhost:3000.

### Login (seed)

| Quem | E-mail | Senha |
|------|--------|-------|
| Mariana (dona) | `mariana@clinica-mariana.local` | `beleza1234` |
| Camila | `camila@clinica-mariana.local` | `beleza1234` |
| Juliana | `juliana@clinica-mariana.local` | `beleza1234` |

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Prepara tudo + Next.js |
| `npm run setup` | Só prepara (env, banco local, seed) |
| `npm run dev:next` | Só Next (banco já rodando) |
| `npm run lint` | ESLint (Next) |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:watch` | Vitest em modo watch |
| `npm run test:e2e` | E2E Playwright (login, cliente, agenda) |
| `npm run test:e2e:ui` | Playwright com UI |
| `npm run db:seed` | Seed da clínica (equipe, serviços, horários) |
| `npm run setup:notifications` | Gera chaves VAPID (Web Push) |
| `npm run test:crypto` | Smoke de crypto com banco (opcional) |
| `npm run deploy:secrets` | Gera segredos para colar na Vercel |

## Testes automatizados

```bash
npm test          # unitários (Vitest)
npm run test:e2e  # ponta a ponta (Playwright)
```

**Unitários:** erros/`actionError`, marca, limites, schemas Zod, crypto.

**E2E (pré-requisito):** Postgres local ativo + seed (`npm run setup` ou `npm run dev`).  
Conta: `mariana@clinica-mariana.local` / `beleza1234`.  
Se o banco `prisma dev` estiver parado: `npx prisma dev --name clinica-de-beleza` e depois `npm run db:seed`.

Cobertura E2E: login (ok/erro), cadastro de cliente, novo agendamento, Configurações (serviços/horários/equipe).

## Deploy (cliente testar)

1. Checklist: [docs/CHECKLIST_DEPLOY_CLIENTE.md](docs/CHECKLIST_DEPLOY_CLIENTE.md)
2. Detalhes: [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)
3. Env modelo: `.env.production.example`
4. Segredos: `npm run deploy:secrets`

## Acessar pelo celular (mesmo Wi‑Fi)

1. `npm run dev`
2. IP local: `ipconfig` → IPv4
3. No celular: `http://SEU-IP:3000`
4. Se o login falhar, ajuste `NEXTAUTH_URL` no `.env` e reinicie
