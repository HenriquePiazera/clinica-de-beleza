# Checklist — Deploy para o cliente testar

Ordem sugerida. Detalhes em [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md).

## Antes (no PC)

- [ ] Código commitado e push no GitHub `HenriquePiazera/clinica-de-beleza`
- [ ] `npm run build` passa localmente
- [ ] Conta Neon **ou** Supabase + projeto **novo** `clinica-mariana-oliveira`
- [ ] `npm run deploy:secrets` → guardar os valores gerados

## Banco Neon

```powershell
$env:DATABASE_URL="postgresql://...pooler-ou-direct...?sslmode=require"
npx prisma db push
npx tsx scripts/seed-demo.mts
```

- [ ] Seed ok (Mariana / Camila / Juliana)

## Vercel

- [ ] Importar repo → Framework Next.js → Node **22.x**
- [ ] Colar variáveis de `.env.production.example` + segredos gerados
- [ ] `DEMO_MODE=false` e `BILLING_ENABLED=false`
- [ ] `MOCK_SMS_ENABLED=true` (SMS de teste na inbox)
- [ ] `DATABASE_URL` = Neon/Supabase **novo** (não local)
- [ ] (Opcional portfólio) Supabase Storage: bucket `clinic-files` + vars na Vercel
- [ ] Deploy Production

## Depois do 1º deploy

- [ ] Copiar URL (`https://….vercel.app`)
- [ ] Atualizar `NEXTAUTH_URL` na Vercel → Redeploy
- [ ] Abrir landing `/`
- [ ] Abrir agendamento (botão Agendar)
- [ ] Login Mariana: `mariana@clinica-mariana.local` / `beleza1234`
- [ ] Conferir equipe/fotos/serviços na landing
- [ ] (Opcional) Abrir Configurações → Notificações → SMS de teste após um agendamento sem e-mail

## Enviar ao cliente

```
Link: https://SEU-PROJETO.vercel.app

Landing: abra o link (sem login)
Agendar: botão "Agendar atendimento"

Painel:
- Mariana: mariana@clinica-mariana.local / beleza1234
- Camila:  camila@clinica-mariana.local / beleza1234
- Juliana: juliana@clinica-mariana.local / beleza1234
```

## Não fazer

- Reutilizar `DATABASE_URL` / `ENCRYPTION_MASTER_KEY` / `AUTH_SECRET` da demo
- Deixar `DEMO_MODE=true` neste projeto do cliente
