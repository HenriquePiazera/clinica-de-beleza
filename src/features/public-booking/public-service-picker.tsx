'use client'

import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Service = {
  id: string
  name: string
  description: string | null
  photo_url: string | null
  duration_minutes: number
  price: number | null
}

type Props = {
  services: Service[]
  selectedId: string
  onSelect: (id: string) => void
}

export function PublicServicePicker({ services, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Escolha o serviço</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const selected = service.id === selectedId
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service.id)}
              aria-pressed={selected}
              className={cn(
                'flex min-h-11 flex-col overflow-hidden rounded-lg border text-left transition-all',
                selected
                  ? 'border-primary bg-primary/5 ring-primary/40 scale-[1.01] shadow-sm ring-2'
                  : 'border-input hover:bg-muted/50'
              )}
            >
              <div className="bg-muted relative aspect-[4/3] w-full">
                {service.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={service.photo_url}
                    alt={service.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex size-full items-center justify-center">
                    <ImageIcon className="size-8" />
                  </div>
                )}
                {selected ? (
                  <span className="bg-primary text-primary-foreground absolute right-2 top-2 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Selecionado
                  </span>
                ) : null}
              </div>
              <div className="space-y-1 p-3">
                <p className="font-medium leading-tight">{service.name}</p>
                {service.description ? (
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {service.description}
                  </p>
                ) : null}
                <p className="text-muted-foreground text-xs">
                  {service.duration_minutes} min
                  {service.price != null
                    ? ` · ${service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                    : ''}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
