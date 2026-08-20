import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Logo } from '@/components/layout/logo'
import { APP_NAME, BRAND } from '@/lib/brand'
import { getDemoSessionHours } from '@/lib/demo'

export default function DemoExpiredPage() {
  const hours = getDemoSessionHours()

  return (
    <div className={BRAND.authSurface}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
        <Logo href="/" size="md" variant="full" />
        <Card>
          <CardHeader>
            <div className="bg-muted text-muted-foreground mb-2 flex size-11 items-center justify-center rounded-full">
              <Clock className="size-5" />
            </div>
            <CardTitle>Demonstração encerrada</CardTitle>
            <CardDescription>
              O acesso de demonstração do {APP_NAME} dura até {hours}{' '}
              {hours === 1 ? 'hora' : 'horas'} a partir do primeiro uso do link.
              Para continuar testando, peça um link novo a quem enviou a demo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="min-h-11">
              <Link href="/">Voltar ao início</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/login">Já tenho acesso permanente</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
