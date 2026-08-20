'use client'

import { useState, useTransition } from 'react'
import { createExpenseAction } from '@/features/cash-flow/actions'
import { EXPENSE_CATEGORIES } from '@/schemas/cash-flow.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ExpenseLaunchForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0])
  const [status, setStatus] = useState('paid')

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lançar despesa</CardTitle>
        <CardDescription>
          Registre um gasto da clínica no fluxo de caixa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={(formData) => {
            formData.set('category', category)
            formData.set('status', status)
            setError(null)
            setSuccess(false)
            startTransition(async () => {
              const result = await createExpenseAction(formData)
              if (!result.success) {
                setError(result.error)
                return
              }
              setSuccess(true)
              const form = document.getElementById(
                'expense-launch-form'
              ) as HTMLFormElement | null
              form?.reset()
              setCategory(EXPENSE_CATEGORIES[0])
              setStatus('paid')
            })
          }}
          id="expense-launch-form"
        >
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              required
              minLength={2}
              className="min-h-11"
              placeholder="Ex.: Compra de insumos"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="min-h-11"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entry_date">Data</Label>
              <Input
                id="entry_date"
                name="entry_date"
                type="date"
                required
                defaultValue={today}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Em atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Detalhes do lançamento"
            />
          </div>

          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : null}
          {success ? (
            <p className="text-sm text-emerald-700">Despesa lançada com sucesso.</p>
          ) : null}

          <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={pending}>
            {pending ? 'Salvando...' : 'Lançar despesa'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
