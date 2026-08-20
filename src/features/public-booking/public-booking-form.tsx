'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fetchPublicDatesAction,
  fetchPublicSlotsAction,
} from '@/features/public-booking/public-api'
import { createPublicBooking } from '@/features/public-booking/actions'
import type { PublicProfessionalDTO } from '@/features/public-booking/actions'
import { PublicServicePicker } from '@/features/public-booking/public-service-picker'
import { PushNotificationPrompt } from '@/components/pwa/push-notification-prompt'
import { subscribeClientToPush } from '@/lib/push-client'

type Props = {
  professional: PublicProfessionalDTO
  selectedSlug: string
}

export function PublicBookingForm({ professional, selectedSlug }: Props) {
  const [serviceId, setServiceId] = useState(professional.services[0]?.id ?? '')
  const [date, setDate] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!serviceId) return
    startTransition(async () => {
      const availableDates = await fetchPublicDatesAction({
        slug: selectedSlug,
        serviceId,
      })
      setDates(availableDates)
      setDate(availableDates[0] ?? '')
      setSelectedSlot('')
      setSlots([])
    })
  }, [serviceId, selectedSlug])

  useEffect(() => {
    if (!serviceId || !date) return
    startTransition(async () => {
      const availableSlots = await fetchPublicSlotsAction({
        slug: selectedSlug,
        serviceId,
        date,
      })
      setSlots(availableSlots)
      setSelectedSlot('')
    })
  }, [serviceId, date, selectedSlug])

  function formatSlotLabel(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setConfirmUrl(null)

    if (!selectedSlot) {
      setError('Selecione um horário.')
      return
    }

    startTransition(async () => {
      const result = await createPublicBooking({
        slug: selectedSlug,
        service_id: serviceId,
        start_time: selectedSlot,
        client_name: name,
        client_phone: phone,
        client_email: email || undefined,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      setConfirmUrl(result.confirmUrl)
      const submittedPhone = phone.trim()

      if (result.notificationChannel === 'push') {
        setMessage(
          'Agendamento solicitado! Enviamos a confirmação por notificação no celular.'
        )
      } else if (result.notificationChannel === 'email') {
        setMessage(
          'Agendamento solicitado! Verifique seu e-mail para confirmar.'
        )
      } else {
        const pushOk = await subscribeClientToPush({
          slug: selectedSlug,
          client_phone: submittedPhone,
          appointmentId: result.appointmentId,
        })
        if (pushOk) {
          setMessage(
            'Agendamento solicitado! Confirmação enviada por notificação no celular.'
          )
        } else {
          setMessage(
            'Agendamento solicitado! Confirme pelo link abaixo ou pelo e-mail, se cadastrou.'
          )
        }
      }

      setName('')
      setPhone('')
      setEmail('')
      setSelectedSlot('')
    })
  }

  if (professional.services.length === 0) {
    return (
      <div className="text-muted-foreground space-y-2 text-sm">
        <p>Nenhum serviço disponível para agendamento no momento.</p>
        <p>O profissional precisa cadastrar serviços em Configurações → Serviços.</p>
      </div>
    )
  }

  if (!professional.setup.ready) {
    return (
      <div className="text-muted-foreground space-y-2 text-sm">
        <p>A agenda online ainda não está pronta.</p>
        {professional.setup.availability_count === 0 ? (
          <p>Configure os horários de atendimento em Configurações → Horários.</p>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PublicServicePicker
        services={professional.services}
        selectedId={serviceId}
        onSelect={setServiceId}
      />

      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <select
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm"
        >
          {dates.length === 0 ? (
            <option value="">Sem datas disponíveis</option>
          ) : (
            dates.map((d) => (
              <option key={d} value={d}>
                {new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Horário</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => (
            <button
              key={slot.start}
              type="button"
              onClick={() => setSelectedSlot(slot.start)}
              className={`min-h-11 rounded-md border px-2 text-sm ${
                selectedSlot === slot.start
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-muted'
              }`}
            >
              {formatSlotLabel(slot.start)}
            </button>
          ))}
        </div>
        {date && slots.length === 0 ? (
          <p className="text-muted-foreground text-xs">Nenhum horário nesta data.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Seu nome *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="min-h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone *</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="min-h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-11"
        />
        <p className="text-muted-foreground text-xs">
          E-mail ou notificações push — usamos o que estiver disponível (grátis).
        </p>
      </div>

      <PushNotificationPrompt slug={selectedSlug} clientPhone={phone} />

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {message ? <p className="text-primary text-sm">{message}</p> : null}
      {confirmUrl ? (
        <div className="bg-muted space-y-2 rounded-md p-3 text-sm">
          <p className="font-medium">Link de confirmação</p>
          <a href={confirmUrl} className="text-primary break-all hover:underline">
            {confirmUrl}
          </a>
        </div>
      ) : null}

      <Button type="submit" className="min-h-11 w-full" disabled={isPending}>
        {isPending ? 'Agendando...' : 'Solicitar agendamento'}
      </Button>
    </form>
  )
}
