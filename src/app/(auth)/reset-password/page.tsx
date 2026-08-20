import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPasswordAction } from '@/features/auth/actions'
import { SubmitButton } from '@/components/forms/submit-button'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token
  if (!token) redirect('/forgot-password')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova senha</CardTitle>
        <CardDescription>Defina uma nova senha para sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            'use server'
            formData.set('token', token)
            const result = await resetPasswordAction(formData)
            if (!result.success) redirect('/reset-password?token=' + token + '&error=1')
            const { redirect: nav } = await import('next/navigation')
            nav('/login')
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className="min-h-11"
            />
          </div>
          <SubmitButton>Salvar senha</SubmitButton>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
