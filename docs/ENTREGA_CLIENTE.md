# Entrega — Clínica de Beleza Mariana Oliveira

## Escopo comercial (fechado)

| Item | Valor |
|------|--------|
| Total | R$ 4.500 |
| Entrada | R$ 1.500 |
| Na entrega | R$ 3.000 |
| Prazo | até 2 semanas |
| Domínio | 5 anos incluído |
| Publicação / configuração | incluídas |
| Garantia | 30 dias (bugs do entregue; novas features fora) |

### Inclui

- Logo própria e painel administrativo
- 3 profissionais com agendas individuais
- Cadastro de clientes e serviços, histórico de atendimentos
- E-mail + Web Push
- Lembrete **manual** WhatsApp (copiar texto)
- Deploy Vercel + banco Neon novos

### Não inclui (agora)

- Integração automática com WhatsApp API (pode ser contratada depois)
- Storage em nuvem como item cobrado à parte (o código já aceita Supabase Storage opcional na Vercel; configurar é operação/portfólio)

---

## O que a clínica configura sozinha (painel)

Com login da dona (**Configurações**):

1. **Equipe** (`/settings/team`) — convidar profissionais por e-mail  
2. **Serviços** (`/settings/services`) — preços, duração, ativo/inativo  
3. **Horários** (`/settings/availability`) — cada profissional, na própria conta, define a agenda  
4. **Página pública** (`/settings/public`) — link e QR de agendamento  
5. **Notificações** (`/settings/notifications`) — antecedência dos lembretes e caixa de SMS de teste (`/settings/notifications/sms`)  
6. **Recibos** (`/settings/receipt`) — dados para comprovante  

No agendamento: botão **Copiar lembrete** → colar no WhatsApp.

---

## Dados iniciais do seed (dev / pré-entrega)

| Profissional | Função | Horário | Serviços |
|--------------|--------|---------|----------|
| Mariana Oliveira | Esteticista | seg–sex 09h–18h | Limpeza de pele — R$ 120 |
| Camila Santos | Designer de Sobrancelhas | seg–sex 10h–19h | Design de sobrancelhas — R$ 60 |
| Juliana Costa | Manicure e Pedicure | ter e qui 09h–17h | Manicure R$ 45 · Pedicure R$ 50 · Combo R$ 85 |

Senha inicial do seed: `beleza1234` (trocar em produção).

---

## Pendências do cliente

- [ ] E-mails **reais** dos 3 profissionais (para login e convites)
- [ ] Domínio escolhido / DNS (quando disponível)
- [ ] E-mail para remetente (Resend) e Web Push (`mailto:`)
- [ ] Confirmar se deseja alterar textos da landing além da marca

---

## Deploy

Passo a passo: [CHECKLIST_DEPLOY_CLIENTE.md](./CHECKLIST_DEPLOY_CLIENTE.md) · [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

Documentação do sistema (uso e arquitetura): [SISTEMA.md](./SISTEMA.md)

**Obrigatório em produção:** `DEMO_MODE=false`, `BILLING_ENABLED=false`, banco e segredos **novos**.

Antes: `npm run test` e `npm run build`. Segredos: `npm run deploy:secrets`.
