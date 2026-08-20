import Link from 'next/link'
import { confirmAppointmentByToken } from '@/features/public-booking/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Props = {
  params: { token: string }
}

export default async function ConfirmAppointmentPage({ params }: Props) {
  const result = await confirmAppointmentByToken(params.token)

  return (
    <div className="bg-secondary/30 flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-base">
            {result.success ? 'Agendamento confirmado' : 'Não foi possível confirmar'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{result.message}</p>
          <Button asChild className="min-h-11 w-full">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
