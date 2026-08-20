import { notFound } from 'next/navigation'
import { getPublicProfessionalBySlug } from '@/features/public-booking/actions'
import { PublicBookingForm } from '@/features/public-booking/public-booking-form'
import { PublicProfessionalPicker } from '@/features/public-booking/public-professional-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { APP_NAME } from '@/lib/brand'

type Props = {
  params: { slug: string }
}

export default async function PublicBookingPage({ params }: Props) {
  const professional = await getPublicProfessionalBySlug(params.slug)
  if (!professional) notFound()

  return (
    <div className="bg-secondary/30 min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">{APP_NAME}</p>
          <h1 className="mt-1 text-2xl font-semibold">{professional.name}</h1>
          {professional.bio ? (
            <p className="text-muted-foreground mt-2 text-sm">{professional.bio}</p>
          ) : null}
        </div>

        {!professional.setup.ready ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="space-y-2 py-4 text-sm text-amber-900">
              <p className="font-medium">Agenda online em configuração</p>
              {professional.setup.services_count === 0 ? (
                <p>Cadastre pelo menos um serviço em Configurações → Serviços.</p>
              ) : null}
              {professional.setup.availability_count === 0 ? (
                <p>Configure horários em Configurações → Horários.</p>
              ) : null}
              <p className="text-xs">
                Se você é o profissional, faça login para completar a configuração.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {professional.team_members && professional.team_members.length > 0 ? (
          <PublicProfessionalPicker
            ownerSlug={professional.slug}
            ownerName={professional.name}
            members={professional.team_members}
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agendar atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <PublicBookingForm
              professional={professional}
              selectedSlug={params.slug}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
