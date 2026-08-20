import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPasswordAction } from '@/features/auth/actions'
import { SubmitButton } from '@/components/forms/submit-button'

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { sent?: string; devUrl?: string }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
        <CardDescription>
          Enviaremos um link para redefinir sua senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        {searchParams.sent ? (
          <p className="text-sm text-muted-foreground">
            Se o e-mail existir, você receberá instruções em breve.
            {searchParams.devUrl ? (
              <>
                <br />
                <span className="mt-2 block break-all text-xs">
                  [DEV] {searchParams.devUrl}
                </span>
              </>
            ) : null}
          </p>
        ) : (
          <form
            action={async (formData) => {
              'use server'
              const result = await forgotPasswordAction(formData)
              const devUrl = result.success ? result.data?.resetUrl : undefined
              const params = new URLSearchParams({ sent: '1' })
              if (devUrl) params.set('devUrl', devUrl)
              const { redirect } = await import('next/navigation')
              redirect(`/forgot-password?${params.toString()}`)
            }}
            className="space-y-4"
          >
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
            <SubmitButton>Enviar link</SubmitButton>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
