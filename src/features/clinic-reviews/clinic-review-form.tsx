'use client'

import { useEffect, useRef } from 'react'
import { useFormState } from 'react-dom'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/forms/submit-button'
import { createClinicReviewAction } from '@/features/clinic-reviews/actions'
import { APP_NAME } from '@/lib/brand'
import type { ActionResult } from '@/lib/session'

type FormState = ActionResult<{ id: string }> | null

export function ClinicReviewForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useFormState<FormState, FormData>(
    createClinicReviewAction,
    null
  )

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state])

  if (state?.success) {
    return (
      <Card className="border-success/40 bg-success/10">
        <CardContent className="space-y-4 py-6">
          <p className="font-medium text-success-foreground">
            Obrigado pelo seu depoimento!
          </p>
          <p className="text-muted-foreground text-sm">
            A equipe da {APP_NAME} vai revisar antes de publicar na página
            inicial.
          </p>
          <Button asChild className="min-h-11 w-full sm:w-auto">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {state?.success === false ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="text-destructive py-4 text-sm">
            {state.error}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <form ref={formRef} action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="author_name">Seu nome *</Label>
              <Input
                id="author_name"
                name="author_name"
                required
                minLength={2}
                maxLength={80}
                className="min-h-11"
                autoComplete="name"
                placeholder="Como deseja aparecer"
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">
                Nota do atendimento (1 a 5) *
              </legend>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map((score) => (
                  <label
                    key={score}
                    className="flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-md border text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={score}
                      required
                      className="sr-only"
                    />
                    {score}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="message">Seu depoimento *</Label>
              <Textarea
                id="message"
                name="message"
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                placeholder="Conte como foi sua experiência na clínica..."
              />
            </div>

            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="allow_publish"
                value="true"
                defaultChecked
                className="mt-1 size-4 rounded border"
              />
              <span>
                Autorizo a {APP_NAME} a publicar meu depoimento na página
                inicial (apenas com aprovação da equipe).
              </span>
            </label>

            <SubmitButton>Enviar depoimento</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
