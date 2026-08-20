'use client'

import { useEffect, useRef } from 'react'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/components/forms/submit-button'
import { createClientAction } from '@/features/clients/actions'
import type { ActionResult } from '@/lib/session'

type FormState = ActionResult<{ id: string }> | null

async function createClientFormAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  return createClientAction(formData)
}

export function NewClientForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useFormState(createClientFormAction, null)

  useEffect(() => {
    if (state?.success && state.data?.id) {
      formRef.current?.reset()
      router.push(`/clients/${state.data.id}`)
      router.refresh()
    }
  }, [state, router])

  return (
    <Card>
      <CardContent className="pt-6">
        {state?.success === false ? (
          <p className="text-destructive mb-4 text-sm">{state.error}</p>
        ) : null}

        <form ref={formRef} action={formAction} className="space-y-4" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" required className="min-h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input id="phone" name="phone" required className="min-h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" className="min-h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de nascimento</Label>
            <Input id="birth_date" name="birth_date" type="date" className="min-h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          <SubmitButton>Salvar cliente</SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
