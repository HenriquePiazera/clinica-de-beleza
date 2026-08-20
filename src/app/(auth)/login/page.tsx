import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginFormAction } from '@/features/auth/actions'
import { SubmitButton } from '@/components/forms/submit-button'
import { APP_TAGLINE } from '@/lib/brand'
import { getDemoSessionHours, isDemoMode } from '@/lib/demo'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ demo?: string; error?: string }>
}) {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  const params = searchParams ? await searchParams : {}
  const demoStarted = params.demo === '1'
  const hasError = params.error === '1'
  const hours = getDemoSessionHours()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>{APP_TAGLINE}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasError ? (
          <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            E-mail ou senha incorretos. Use a conta demo:
            demo@assistente-admin.local / demo1234
          </p>
        ) : null}
        {isDemoMode() && demoStarted ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Link de demonstração ativado. Você tem até {hours}h a partir do
            primeiro acesso a este link.
          </p>
        ) : null}
        {isDemoMode() && !demoStarted ? (
          <p className="text-muted-foreground mb-4 text-sm">
            Visitantes: use o link de demonstração que você recebeu. Sem o link,
            o acesso expira ou fica bloqueado após o tempo limite.
          </p>
        ) : null}
        <form action={loginFormAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="min-h-11"
            />
          </div>
          <SubmitButton>Entrar</SubmitButton>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-primary underline-offset-4 hover:underline"
          >
            Esqueci minha senha
          </Link>
          <p>
            Não tem conta?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
