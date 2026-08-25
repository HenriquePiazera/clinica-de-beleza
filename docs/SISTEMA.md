# Documentação do sistema — Clínica de Beleza Mariana Oliveira

Manual de referência do aplicativo entregue à clínica: o que faz, como usar e como está organizado tecnicamente.

Documentos relacionados:

| Documento | Conteúdo |
|-----------|----------|
| [ENTREGA_CLIENTE.md](./ENTREGA_CLIENTE.md) | Escopo comercial e o que a clínica configura |
| [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) | Deploy Vercel + Neon |
| [CHECKLIST_DEPLOY_CLIENTE.md](./CHECKLIST_DEPLOY_CLIENTE.md) | Checklist de publicação |
| [README.md](../README.md) | Setup local, scripts e testes |

---

## 1. Visão geral

Sistema web de **agenda e atendimento** para a Clínica de Beleza Mariana Oliveira (estética, beleza e bem-estar).

Não é um SaaS com planos pagos para assinantes. Em produção deve rodar com:

- `DEMO_MODE=false`
- `BILLING_ENABLED=false`

**Fluxo de negócio principal:**

```
Cliente → Agendamento → Atendimento → Histórico/evolução → Pagamento → Reagendamento
```

**Stack:** Next.js 14 (App Router) · React · TypeScript · Tailwind · Prisma · PostgreSQL · Auth.js · Server Actions.

---

## 2. Atores e acessos

| Ator | Acesso |
|------|--------|
| Dona / equipe (profissionais) | Login no painel (`/dashboard` e módulos) |
| Cliente da clínica (paciente) | Landing, agendamento público (`/p/...`), depoimento (`/avaliar`), confirmação por link |
| Dona da plataforma (dev) | Painel `/internal` (e-mails em `PLATFORM_OWNER_EMAILS`) |

### Contas do seed (desenvolvimento)

Senha inicial: `beleza1234` (trocar em produção).

| Quem | E-mail | Papel |
|------|--------|--------|
| Mariana Oliveira | `mariana@clinica-mariana.local` | Dona / esteticista |
| Camila Santos | `camila@clinica-mariana.local` | Sobrancelhas |
| Juliana Costa | `juliana@clinica-mariana.local` | Manicure / pedicure |

---

## 3. Mapa de rotas

### Público

| Rota | Função |
|------|--------|
| `/` ou `/landing` | Site da clínica (equipe, serviços, depoimentos, contato) |
| `/p/[slug]` | Agendamento online da profissional |
| `/confirm/[token]` | Cliente confirma o horário pelo link do e-mail/lembrete |
| `/avaliar` | Formulário de depoimento (sem login) |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Autenticação |

### Painel (login obrigatório)

| Rota | Função |
|------|--------|
| `/dashboard` | Resumo / métricas |
| `/clients` | Clientes |
| `/appointments` | Agenda |
| `/records` | Histórico de atendimentos |
| `/payments` | Financeiro (baixas e recibos) |
| `/feedback` | Moderação de depoimentos (Depoimentos) |
| `/settings/*` | Equipe, serviços, horários, página pública, notificações, recibo |
| `/account` | Conta da profissional |

---

## 4. Uso por módulo

### 4.1 Clientes

- Cadastro com nome, telefone, e-mail, observações.
- Lista e detalhe com edição.
- Isolamento por equipe: a dona enxerga clientes da equipe; cada registro fica vinculado ao profissional (`user_id`).

### 4.2 Agenda

- Lista com busca por nome, filtro por data e ordenação.
- Novo agendamento: cliente, data/hora, observações.
- Detalhe: editar, cancelar, **excluir**, copiar lembrete WhatsApp (texto manual).
- Status possíveis:
  - **Agendado**
  - **Aguardando confirmação**
  - **Confirmado**
  - **Realizado**
  - **Cancelado**

**Regras de data passada**

- Horário já passou → status só pode ser **Realizado** ou **Cancelado** (ou excluir o agendamento).
- Não é permitido marcar status “em aberto” (agendado / aguardando / confirmado) em atendimento passado.

**Alerta de confirmação (laranja, piscante)**

- Se o status for **Agendado** ou **Aguardando confirmação** e faltarem **12 horas ou menos** para o horário, o card destaca alerta para a profissional contatoar a cliente e confirmar, cancelar ou excluir.

### 4.3 Histórico

- **Fila aguardando anotações:** atendimentos **Realizado** ou **Cancelado** sem registro de atendimento.
- Botão **Registrar anotações** abre o formulário já preenchido.
- Após salvar o registro, o item sai da fila.
- **Alerta laranja** se a pendência passar da **00:00 do dia seguinte** ao atendimento.
- Mesmos filtros de busca da agenda (nome, data, ordenação).
- Registros concluídos: descrição e evolução (campos sensíveis criptografados).

### 4.4 Financeiro

- **Fila aguardando baixa:** realizados/cancelados sem pagamento vinculado.
- **Registrar baixa** → formulário com:
  - uma ou mais **formas de pagamento** (ex.: metade PIX + metade cartão);
  - **observações**;
  - status (pago / pendente / cancelado).
- Mesmos filtros da agenda.
- Pagamentos **pagos** permitem emitir recibo.
- Alerta laranja na fila após a meia-noite do dia seguinte (igual ao histórico).

### 4.5 Depoimentos (ex-Feedback SaaS)

O menu **Depoimentos** (`/feedback`) **não** é feedback do produto SaaS. É a moderação de avaliações das clientes.

1. Cliente envia em `/avaliar` (nome, nota 1–5, mensagem, autorização para publicar).
2. Entrada fica **pendente**.
3. Mariana (ou equipe logada) decide:
   - **Mostrar na landing**
   - **Tirar da landing**
   - **Arquivar**
4. A landing exibe só depoimentos aprovados (`show_on_landing` + autorização).

Seed local já inclui depoimentos fictícios publicados para demonstração.

### 4.6 Configurações

| Tela | Uso |
|------|-----|
| Equipe | Convidar profissionais |
| Serviços | Nome, preço, duração, ativo |
| Horários | Disponibilidade da profissional logada |
| Página pública | Slug / bio / foto para `/p/[slug]` |
| Notificações | Antecedência de lembretes |
| Recibo | Dados fiscais/endereço no comprovante |

Lembrete WhatsApp: no card do agendamento, **Copiar lembrete** → colar no app. Não há WhatsApp API automática neste escopo.

---

## 5. Páginas públicas (cliente final)

### Landing

- Marca, apresentação, equipe e serviços (dados do cadastro).
- Diferenciais editoriais (`src/lib/brand.ts`).
- Depoimentos aprovados + CTA “Deixar depoimento”.
- Contato (WhatsApp / Instagram / endereço — ajustar na marca quando o cliente enviar dados reais).
- CTA de agendamento aponta para o slug público da dona.

### Agendamento online (`/p/[slug]`)

- Cliente escolhe serviço, data e horário disponíveis.
- Pode gerar status **aguardando confirmação**, conforme fluxo de booking/confirmação.

### Avaliar (`/avaliar`)

- Formulário público; rate limit por IP no servidor.
- Não publica sozinho: depende da moderação no painel.

---

## 6. Notificações

| Canal | Situação |
|-------|----------|
| E-mail (Resend) | Agendamento / cancelamento / reagendamento (quando configurado) |
| Web Push | Opcional (VAPID); cliente pode instalar PWA e autorizar |
| SMS simulado | `MOCK_SMS_ENABLED=true` — grava sempre na caixa `/settings/notifications/sms` quando há telefone (custo R$ 0); paralelo ao e-mail/push |
| Cron | `/api/cron/reminders` (protegido por `CRON_SECRET`) |
| WhatsApp | Apenas texto copiado manualmente |

Sem `RESEND_API_KEY` / domínio verificado, o envio de e-mail fica limitado (ex.: remetente de teste do Resend). Com SMS simulado ligado, o texto aparece na caixa de teste mesmo quando o e-mail envia.

Canal principal retornado: **e-mail → push → SMS simulado → nenhum** (o SMS simulado ainda assim é gravado se estiver ativo).

---

## 7. Arquitetura técnica

```
src/
  app/           # Rotas Next.js (App Router)
  components/    # UI compartilhada (layout, forms, landing, lists)
  features/      # Server Actions e UI por domínio
  schemas/       # Zod (front/back)
  services/      # Regras de domínio (conflito de agenda, métricas, e-mail…)
  lib/           # Sessão, crypto, brand, status, team, prisma
  generated/     # Prisma Client gerado
```

### Princípios obrigatórios

1. **Isolamento:** consultas com `id` + `userId` (ou escopo de equipe via `getTeamMemberIds`). Nunca `findUnique` só por `id` em dados sensíveis.
2. **Criptografia:** campos sensíveis com `encryptField` / `decryptField` e `userId` (`src/lib/crypto.ts`).
3. **Auditoria:** `logAudit()` em writes relevantes (`src/lib/audit.ts`).
4. **Erros:** `ERROR_CODES` em português; sem stack/SQL ao usuário.
5. **Validação:** Zod no servidor (e formulários).
6. **Mobile first:** alvo 375px; botões ≥ 44px.

### Modelos principais (Prisma)

- `User`, `TeamMember`, `Client`, `Service`, `Availability`
- `Appointment` (+ confirmações)
- `ServiceRecord`, `Attachment`
- `Payment` (`method_splits` JSON, `notes`)
- `ClinicReview` (depoimentos da landing)
- `MockSmsMessage` (SMS simulado / inbox de teste)
- `UserFeedback` (legado NPS do produto SaaS — não é o fluxo da clínica)
- `AuditLog`, tokens de reset, cash-flow interno, demo links

### Anexos

Arquivos em pasta local `storage/` (não Supabase). Em Vercel, upload pode falhar por filesystem efêmero — ver entrega.

---

## 8. Ambientes

### Local

```bash
npm install
npm run dev
```

Prepara `.env`, Postgres (`prisma dev`), schema, seed e Next em http://localhost:3000.

Banco local: nome `clinica-de-beleza`. Manter `npx prisma dev --name clinica-de-beleza` se o Postgres parar.

### Produção

- Vercel + Neon **novos** (não reutilizar `DATABASE_URL` / segredos da demo).
- `DEMO_MODE=false`, `BILLING_ENABLED=false`.
- Segredos: `AUTH_SECRET`, `ENCRYPTION_MASTER_KEY`, `CRON_SECRET`, etc. (`npm run deploy:secrets`).
- Passo a passo: [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md).

---

## 9. Testes

```bash
npm test          # Vitest
npm run test:e2e  # Playwright (banco + seed ativos)
npm run build     # Build de produção
```

E2E cobre login, cliente, agendamento e partes de configurações.

---

## 10. Checklist operacional (clínica)

1. Ajustar serviços, horários e página pública.
2. Usar a agenda no dia a dia; acompanhar cards laranja (confirmação / filas atrasadas).
3. Após o atendimento: marcar **Realizado** ou **Cancelado**.
4. Concluir **Histórico** (anotações) e **Financeiro** (baixa) para limpar as filas.
5. Moderar **Depoimentos** e escolher o que aparece na landing.
6. Trocar senhas padrão em produção; manter backups do Neon.

---

## 11. Fora do escopo atual

- WhatsApp API automática
- Storage em nuvem para anexos
- App mobile nativo / PWA avançado além do básico
- Cobrança Stripe / planos SaaS na UI
- Avaliação pós-atendimento vinculada obrigatoriamente ao agendamento (hoje o `/avaliar` é aberto)

Ampliações devem ser pedidas à parte (ver garantia em [ENTREGA_CLIENTE.md](./ENTREGA_CLIENTE.md)).
