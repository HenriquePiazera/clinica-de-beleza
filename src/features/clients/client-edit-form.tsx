'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/forms/submit-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateClientAction } from '@/features/clients/actions'
import type { ClientDTO } from '@/features/clients/types'

type Props = {
  client: ClientDTO
}

export function ClientEditForm({ client }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateClientAction(client.id, formData)
      if (!result.success) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      setSuccessOpen(true)
    })
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    router.push('/clients')
    router.refresh()
  }

  return (
    <>
      <form ref={formRef} action={handleSubmit} className="space-y-4" autoComplete="off">
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            defaultValue={client.name}
            required
            className="min-h-11"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={client.phone}
            required
            className="min-h-11"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client.email ?? ''}
            className="min-h-11"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data de nascimento</Label>
          <Input
            id="birth_date"
            name="birth_date"
            type="date"
            defaultValue={client.birth_date ?? ''}
            className="min-h-11"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={client.notes ?? ''}
            rows={3}
            disabled={isPending}
          />
        </div>
        <SubmitButton>Atualizar</SubmitButton>
      </form>

      <Dialog open={successOpen} onOpenChange={(open) => !open && handleSuccessClose()}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastro atualizado</DialogTitle>
            <DialogDescription>
              Cadastro atualizado com sucesso.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" className="min-h-11 w-full" onClick={handleSuccessClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
