import Link from 'next/link'
import {
  Calendar,
  Users,
  FileText,
  Wallet,
  FolderOpen,
  Smartphone,
  Monitor,
  CheckCircle2,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/layout/logo'
import { ShellHeader } from '@/components/layout/shell-header'
import { cn } from '@/lib/utils'
import { APP_NAME, APP_TAGLINE, APP_SLOGAN, BRAND } from '@/lib/brand'

type FeatureItem = {
  title: string
  description: string
  icon?: LucideIcon
  icons?: LucideIcon[]
}

const features: FeatureItem[] = [
  {
    icon: Users,
    title: 'Clientes organizados',
    description:
      'Cadastre contatos, histórico e observações em um só lugar — sem planilhas.',
  },
  {
    icon: Calendar,
    title: 'Agenda inteligente',
    description:
      'Agende atendimentos, evite conflitos de horário e reduza faltas com lembretes.',
  },
  {
    icon: FileText,
    title: 'Histórico e evolução',
    description:
      'Registre cada atendimento e acompanhe a evolução dos seus clientes ao longo do tempo.',
  },
  {
    icon: FolderOpen,
    title: 'Arquivos seguros',
    description:
      'Anexe fotos e documentos na ficha do cliente, com armazenamento protegido.',
  },
  {
    icon: Wallet,
    title: 'Financeiro simples',
    description:
      'Controle o que recebeu de cada cliente — sem ERP, sem complicação.',
  },
  {
    icons: [Smartphone, Monitor],
    title: 'Celular, tablet e computador',
    description:
      'Use no dia a dia no celular, tablet ou computador — onde você realmente trabalha.',
  },
]

const professions = [
  'Clínicas',
  'Salões',
  'Estética',
  'Psicólogos',
  'Nutricionistas',
  'Barbeiros',
  'Personal trainers',
]

const steps = [
  { label: 'Cliente', description: 'Cadastre quem você atende' },
  { label: 'Agendamento', description: 'Marque data e horário' },
  { label: 'Atendimento', description: 'Realize o serviço' },
  { label: 'Registro', description: 'Documente histórico e evolução' },
  { label: 'Pagamento', description: 'Controle o que recebeu' },
]

export function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className={BRAND.surface}>
      <ShellHeader>
        <Logo href="/" size="md" variant="full" />
        <nav className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <Button asChild className="min-h-11">
                <Link href="/dashboard">
                  Ir para o painel
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button asChild className="min-h-11">
                <Link href="/login">Entrar na demonstração</Link>
              </Button>
            )}
          </nav>
      </ShellHeader>

      <main>
        <section className={BRAND.hero}>
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
              Demonstração — gestão de atendimento
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl sm:leading-tight">
              {APP_TAGLINE.split('•').map((part, index) => (
                <span key={part}>
                  {index > 0 ? ' • ' : null}
                  {index === 0 ? (
                    <span className="text-primary">{part.trim()}</span>
                  ) : (
                    part.trim()
                  )}
                </span>
              ))}
            </h1>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">
              {APP_SLOGAN}. Sistema de agenda e atendimento para clínicas,
              salões e profissionais — sem caderno, sem planilha e sem depender
              do WhatsApp para gerir o dia a dia.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {isLoggedIn ? (
                <Button asChild size="lg" className="min-h-11">
                  <Link href="/dashboard">
                    Ir para o painel
                    <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="min-h-11">
                    <Link href="/login">
                      Entrar na demonstração
                      <ArrowRight />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-5 text-center">
                <p className="text-2xl font-semibold">+ organização</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Tudo num só lugar
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/15 bg-primary/5">
              <CardContent className="py-5 text-center">
                <p className="text-primary text-2xl font-semibold">Menos faltas</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Lembretes prontos para enviar
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/15 bg-secondary/50">
              <CardContent className="py-5 text-center">
                <p className="text-2xl font-semibold">Mais histórico</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Evolução de cada cliente
                </p>
              </CardContent>
            </Card>
          </div>
          </div>
        </section>

        <section className={BRAND.sectionMuted + ' px-4 py-14'}>
          <div className="mx-auto max-w-5xl">
            <h2 className={cn('text-center', BRAND.pageTitle)}>Para quem é</h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed">
              {APP_NAME} reúne agenda e organização administrativa simples
              para clínicas, salões, estética e profissionais que atendem por
              horário marcado.
            </p>
            <p className="text-muted-foreground mx-auto mt-6 text-center text-xs uppercase tracking-wide">
              Exemplos de quem pode usar
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {professions.map((profession) => (
                <Badge key={profession} variant="outline" className="border-primary/20 px-3 py-1.5">
                  {profession}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold">Tudo que você precisa no dia a dia</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              O valor não é só a agenda — é a organização completa do seu
              atendimento.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-2 flex h-10 w-fit items-center gap-2 rounded-lg px-3">
                      {feature.icons ? (
                        feature.icons.map((DeviceIcon, index) => (
                          <DeviceIcon key={index} className="size-4" />
                        ))
                      ) : Icon ? (
                        <Icon className="size-5" />
                      ) : null}
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className={BRAND.sectionMuted + ' px-4 py-16'}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold">Como funciona</h2>
            <p className="text-muted-foreground mt-2 text-center text-sm">
              Do primeiro contato ao recebimento — um fluxo simples e natural.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-5">
              {steps.map((step, index) => (
                <div key={step.label} className="text-center">
                  <div className="bg-primary text-primary-foreground mx-auto flex size-9 items-center justify-center rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="mt-3 font-medium">{step.label}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/40">
            <CardContent className="p-8 sm:p-10">
              <div className="mx-auto max-w-xl text-center">
                <h2 className="text-2xl font-semibold">
                  Experimente o fluxo completo
                </h2>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  Clientes, agenda, histórico, arquivos e recebimentos — em um
                  ambiente de demonstração pronto para testar no celular.
                </p>
                <ul className="mt-6 space-y-2 text-left text-sm sm:mx-auto sm:max-w-sm">
                  {[
                    'Agenda online, clientes e histórico',
                    'Registros de atendimento e evolução',
                    'Pagamentos e recibo',
                    'Funciona no celular e no computador',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-8 min-h-11 w-full sm:w-auto">
                  <Link href="/login">Entrar na demonstração</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-secondary/40 px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} {APP_NAME} — demonstração</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Entrar na demonstração
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
