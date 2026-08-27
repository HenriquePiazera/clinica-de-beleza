'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fetchPublicScheduleAction,
  fetchPublicSlotsAction,
} from '@/features/public-booking/public-api'
import { createPublicBooking } from '@/features/public-booking/actions'
import type { PublicProfessionalDTO } from '@/features/public-booking/actions'
import { PublicServicePicker } from '@/features/public-booking/public-service-picker'
import { PushNotificationPrompt } from '@/components/pwa/push-notification-prompt'
import { subscribeClientToPush } from '@/lib/push-client'
import { formatDisplayDate } from '@/lib/datetime'

type Props = {
  professional: PublicProfessionalDTO
  selectedSlug: string
}

export function PublicBookingForm({ professional, selectedSlug }: Props) {
  const [serviceId, setServiceId] = useState('')
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
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, startSubmitTransition] = useTransition()
  const detailsRef = useRef<HTMLDivElement>(null)
  const scheduleRequestRef = useRef(0)
  const slotsRequestRef = useRef(0)
  const skipSlotsFetchForDateRef = useRef<string | null>(null)

  const selectedService = professional.services.find((s) => s.id === serviceId)

  useEffect(() => {
    if (!serviceId) {
      setDates([])
      setDate('')
      setSlots([])
      setSelectedSlot('')
      setIsLoadingSchedule(false)
      setIsLoadingSlots(false)
      skipSlotsFetchForDateRef.current = null
      return
    }

    skipSlotsFetchForDateRef.current = null
    const requestId = ++scheduleRequestRef.current
    setIsLoadingSchedule(true)
    setError(null)

    void fetchPublicScheduleAction({
      slug: selectedSlug,
      serviceId,
    })
      .then((schedule) => {
        if (requestId !== scheduleRequestRef.current) return
        setDates(schedule.dates)
        setDate(schedule.selectedDate)
        setSlots(schedule.slots)
        setSelectedSlot('')
        skipSlotsFetchForDateRef.current = schedule.selectedDate || null
      })
      .catch(() => {
        if (requestId !== scheduleRequestRef.current) return
        setDates([])
        setDate('')
        setSlots([])
        setError('Não foi possível carregar os horários. Tente novamente.')
      })
      .finally(() => {
        if (requestId === scheduleRequestRef.current) {
          setIsLoadingSchedule(false)
        }
      })
  }, [serviceId, selectedSlug])

  useEffect(() => {
    if (!serviceId || !date || isLoadingSchedule) {
      if (!date) {
        setSlots([])
        setSelectedSlot('')
        setIsLoadingSlots(false)
      }
      return
    }

    if (skipSlotsFetchForDateRef.current === date) {
      skipSlotsFetchForDateRef.current = null
      return
    }

    const requestId = ++slotsRequestRef.current
    setIsLoadingSlots(true)

    void fetchPublicSlotsAction({
      slug: selectedSlug,
      serviceId,
      date,
    })
      .then((availableSlots) => {
        if (requestId !== slotsRequestRef.current) return
        setSlots(availableSlots)
        setSelectedSlot('')
      })
      .catch(() => {
        if (requestId !== slotsRequestRef.current) return
        setSlots([])
        setError('Não foi possível carregar os horários. Tente novamente.')
      })
      .finally(() => {
        if (requestId === slotsRequestRef.current) {
          setIsLoadingSlots(false)
        }
      })
  }, [serviceId, date, selectedSlug])

  useEffect(() => {
    if (!serviceId || !detailsRef.current) return
    detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [serviceId])

  function handleSelectService(id: string) {
    setServiceId(id)
    setError(null)
    setMessage(null)
    setConfirmUrl(null)
  }

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

    if (!serviceId) {
      setError('Selecione um serviço.')
      return
    }

    if (isLoadingSchedule || isLoadingSlots) {
      setError('Aguarde o carregamento dos horários.')
      return
    }

    if (!selectedSlot) {
      setError('Selecione um horário.')
      return
    }

    startSubmitTransition(async () => {
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
      const submittedEmail = email.trim()

      if (result.notificationChannel === 'email') {
        setMessage(
          'Agendamento solicitado! Verifique seu e-mail para confirmar.'
        )
      } else if (result.notificationChannel === 'push') {
        setMessage(
          'Agendamento solicitado! Enviamos a confirmação por notificação no celular.'
        )
      } else if (result.notificationChannel === 'mock_sms') {
        setMessage(
          'Agendamento solicitado! Confirme pelo link abaixo (SMS de teste gravado na clínica).'
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
        } else if (submittedEmail) {
          setMessage(
            'Agendamento solicitado! O e-mail de confirmação não pôde ser enviado agora — use o link abaixo.'
          )
        } else {
          setMessage(
            'Agendamento solicitado! Confirme pelo link abaixo (informe e-mail na próxima vez para receber confirmação).'
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
        onSelect={handleSelectService}
      />

      {!selectedService ? (
        <p className="text-muted-foreground text-sm">
          Selecione um serviço acima para preencher data, horário e seus dados.
        </p>
      ) : (
        <div
          ref={detailsRef}
          id="booking-details"
          className="scroll-mt-6 space-y-4"
        >
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground -ml-2 min-h-11 gap-1.5 px-2"
            disabled={isSubmitting}
            onClick={() => {
              setServiceId('')
              setDate('')
              setDates([])
              setSlots([])
              setSelectedSlot('')
              setError(null)
              setMessage(null)
              setConfirmUrl(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <ArrowLeft className="size-5 shrink-0" />
            <span className="text-sm font-medium">Voltar aos serviços</span>
          </Button>

          <div
            className="border-primary bg-primary/5 ring-primary/20 rounded-lg border-2 p-3 ring-2"
            aria-live="polite"
          >
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Serviço selecionado
            </p>
            <p className="text-foreground mt-1 text-base font-semibold leading-tight">
              {selectedService.name}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {selectedService.duration_minutes} min
              {selectedService.price != null
                ? ` · ${selectedService.price.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}`
                : ''}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <select
              id="date"
              value={date}
              disabled={isLoadingSchedule || isSubmitting}
              onChange={(e) => setDate(e.target.value)}
              className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm disabled:opacity-60"
            >
              {isLoadingSchedule ? (
                <option value="">Carregando datas...</option>
              ) : dates.length === 0 ? (
                <option value="">Sem datas disponíveis</option>
              ) : (
                dates.map((d) => (
                  <option key={d} value={d}>
                    {formatDisplayDate(d)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Horário</Label>
            {isLoadingSlots ? (
              <p className="text-muted-foreground text-xs">Carregando horários...</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedSlot(slot.start)}
                    className={`min-h-11 rounded-md border px-2 text-sm disabled:opacity-60 ${
                      selectedSlot === slot.start
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-muted'
                    }`}
                  >
                    {formatSlotLabel(slot.start)}
                  </button>
                ))}
              </div>
            )}
            {date && !isLoadingSlots && slots.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Nenhum horário nesta data.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Seu nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              className="min-h-11"
            />
            <p className="text-muted-foreground text-xs">
              Informe o e-mail para receber a confirmação do agendamento.
            </p>
          </div>

          <PushNotificationPrompt slug={selectedSlug} clientPhone={phone} />

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {message ? <p className="text-primary text-sm">{message}</p> : null}
          {confirmUrl ? (
            <div className="bg-muted space-y-2 rounded-md p-3 text-sm">
              <p className="font-medium">Link de confirmação</p>
              <a
                href={confirmUrl}
                className="text-primary break-all hover:underline"
              >
                {confirmUrl}
              </a>
            </div>
          ) : null}

          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={isSubmitting || isLoadingSchedule || isLoadingSlots}
          >
            {isSubmitting ? 'Agendando...' : 'Solicitar agendamento'}
          </Button>
        </div>
      )}
    </form>
  )
}
