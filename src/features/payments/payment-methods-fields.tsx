'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodSplit,
} from '@/lib/payment-labels'
import { selectFieldClassName } from '@/lib/labels'

type SplitRow = {
  key: string
  method: string
  amount: string
}

type Props = {
  idPrefix?: string
  defaultNotes?: string
  defaultSplits?: PaymentMethodSplit[]
}

function newRow(method = 'pix', amount = ''): SplitRow {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method,
    amount,
  }
}

export function PaymentMethodsFields({
  idPrefix = 'payment',
  defaultNotes = '',
  defaultSplits,
}: Props) {
  const [rows, setRows] = useState<SplitRow[]>(() =>
    defaultSplits && defaultSplits.length > 0
      ? defaultSplits.map((s) => newRow(s.method, String(s.amount)))
      : [newRow()]
  )
  const [notes, setNotes] = useState(defaultNotes)

  const total = useMemo(
    () =>
      rows.reduce((acc, row) => {
        const n = Number(row.amount.replace(',', '.'))
        return acc + (Number.isFinite(n) ? n : 0)
      }, 0),
    [rows]
  )

  const splitsPayload = useMemo(
    () =>
      JSON.stringify(
        rows.map((row) => ({
          method: row.method,
          amount: Number(row.amount.replace(',', '.')),
        }))
      ),
    [rows]
  )

  return (
    <div className="space-y-4">
      <input type="hidden" name="amount" value={total.toFixed(2)} />
      <input type="hidden" name="payment_method" value={rows[0]?.method ?? 'pix'} />
      <input type="hidden" name="method_splits" value={splitsPayload} />

      <div className="space-y-3">
        <div>
          <Label>Formas de pagamento *</Label>
          <p className="text-muted-foreground text-xs">
            Use uma ou mais linhas (ex.: metade PIX e metade cartão).
          </p>
        </div>
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]"
          >
            <div className="space-y-1">
              <Label
                htmlFor={`${idPrefix}-method-${index}`}
                className="sr-only"
              >
                Método {index + 1}
              </Label>
              <select
                id={`${idPrefix}-method-${index}`}
                value={row.method}
                onChange={(e) => {
                  const value = e.target.value
                  setRows((prev) =>
                    prev.map((r) =>
                      r.key === row.key ? { ...r, method: value } : r
                    )
                  )
                }}
                className={selectFieldClassName}
                required
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor={`${idPrefix}-amount-${index}`}
                className="sr-only"
              >
                Valor {index + 1}
              </Label>
              <Input
                id={`${idPrefix}-amount-${index}`}
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={row.amount}
                onChange={(e) => {
                  const value = e.target.value
                  setRows((prev) =>
                    prev.map((r) =>
                      r.key === row.key ? { ...r, amount: value } : r
                    )
                  )
                }}
                className="min-h-11"
              />
            </div>
            {rows.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() =>
                  setRows((prev) => prev.filter((r) => r.key !== row.key))
                }
              >
                Remover
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={rows.length >= 6}
            onClick={() => setRows((prev) => [...prev, newRow()])}
          >
            Adicionar método
          </Button>
          <p className="text-sm font-medium">
            Total:{' '}
            {total.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`}>Observações</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações sobre a baixa ou o pagamento..."
          maxLength={1000}
        />
      </div>
    </div>
  )
}
