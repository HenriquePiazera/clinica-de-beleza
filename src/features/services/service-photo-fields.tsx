import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import type { ServiceDTO } from '@/features/services/actions'

type Props = {
  service: ServiceDTO
}

export function ServicePhotoPreview({ service }: Props) {
  if (service.photo_display_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={service.photo_display_url}
        alt={service.name}
        className="size-20 shrink-0 rounded-lg object-cover"
      />
    )
  }

  return (
    <div className="bg-muted text-muted-foreground flex size-20 shrink-0 items-center justify-center rounded-lg">
      <ImageIcon className="size-6" />
    </div>
  )
}

export function ServicePhotoFields({
  currentPhotoUrl,
  showRemove = false,
}: {
  currentPhotoUrl?: string | null
  showRemove?: boolean
}) {
  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="space-y-2">
        <label htmlFor="photo" className="text-sm font-medium">
          Foto do serviço
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="border-input bg-background file:bg-muted file:text-foreground min-h-11 w-full rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1"
        />
        <p className="text-muted-foreground text-xs">
          JPG, PNG ou WebP. Máximo 5 MB. Aparece na página de agendamento.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="photo_url" className="text-sm font-medium">
          Ou URL da foto
        </label>
        <input
          id="photo_url"
          name="photo_url"
          type="url"
          defaultValue={
            currentPhotoUrl?.startsWith('http') ? currentPhotoUrl : ''
          }
          placeholder="https://..."
          className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm"
        />
      </div>
      {showRemove && currentPhotoUrl ? (
        <label className="flex items-center gap-2 text-sm">
          <input name="remove_photo" type="checkbox" />
          Remover foto atual
        </label>
      ) : null}
    </div>
  )
}

export function ServiceListItem({
  service,
  editHref,
}: {
  service: ServiceDTO
  editHref: string
}) {
  return (
    <div className="flex flex-1 items-center gap-4">
      <ServicePhotoPreview service={service} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {service.name}{' '}
          {!service.is_active ? (
            <span className="text-muted-foreground text-sm">(inativo)</span>
          ) : null}
        </p>
        {service.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {service.description}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-1 text-sm">
          {service.duration_minutes} min
          {service.price != null
            ? ` · ${service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
            : ''}
        </p>
        <Link href={editHref} className="text-primary mt-1 inline-block text-sm hover:underline">
          Editar
        </Link>
      </div>
    </div>
  )
}
