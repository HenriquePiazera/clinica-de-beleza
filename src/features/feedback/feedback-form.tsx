'use client'

import { useEffect, useRef } from 'react'
import { APP_NAME } from '@/lib/brand'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/components/forms/submit-button'
import { submitFeedbackAction } from '@/features/feedback/actions'
import { feedbackCategories } from '@/schemas/feedback.schema'
import { FEEDBACK_CATEGORY_LABELS, selectFieldClassName } from '@/lib/labels'
import type { ActionResult } from '@/lib/session'

type FeedbackFormState =
  ActionResult<{ emailSent: boolean; emailError?: string }> | null

export function FeedbackForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useFormState<FeedbackFormState, FormData>(
    submitFeedbackAction,
    null
  )

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [state, router])

  return (
    <div>
      {state?.success ? (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardContent className="py-4 text-sm text-green-900">
            Obrigado! Seu feedback foi registrado com sucesso.
            {state.data?.emailSent === false ? (
              <span className="mt-1 block text-green-800">
                A notificação por e-mail não foi enviada (Resend ainda não
                configurado). Você pode ver o feedback em /internal/feedbacks.
              </span>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {state?.success === false ? (
        <Card className="mb-4 border-destructive/30 bg-destructive/5">
          <CardContent className="text-destructive py-4 text-sm">
            {state.error}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <form ref={formRef} action={formAction} className="space-y-6">
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">
                Quanto você recomendaria o {APP_NAME}? (0 a 10) *
              </legend>
              <div className="flex gap-1.5 sm:gap-2">
                {Array.from({ length: 11 }, (_, score) => (
                  <label
                    key={score}
                    className="flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-md border text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                  >
                    <input
                      type="radio"
                      name="nps_score"
                      value={score}
                      required
                      className="sr-only"
                    />
                    {score}
                  </label>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                0 = não recomendaria · 10 = recomendaria com certeza
              </p>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className={selectFieldClassName}
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {feedbackCategories.map((category) => (
                  <option key={category} value={category}>
                    {FEEDBACK_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Sua mensagem *</Label>
              <Textarea
                id="message"
                name="message"
                rows={5}
                required
                minLength={10}
                maxLength={2000}
                placeholder="Conte o que está funcionando bem, o que poderia melhorar ou o que está difícil de usar."
              />
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="can_contact"
                value="true"
                defaultChecked
                className="size-4 rounded border"
              />
              Pode entrar em contato comigo sobre este feedback
            </label>

            <SubmitButton>Enviar feedback</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
