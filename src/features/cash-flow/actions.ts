'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import {
  actionError,
  getClientIp,
  requireUserId,
  type ActionResult,
} from '@/lib/session'
import { isPlatformOwner } from '@/lib/platform-owner'
import {
  EXPENSE_SEED,
  RECEIVABLE_SEED,
  daysAgoDate,
} from '@/lib/cash-flow-demo'
import { expenseLaunchSchema } from '@/schemas/cash-flow.schema'

type CashFlowType = 'receivable' | 'expense'
type CashFlowStatus = 'paid' | 'pending' | 'overdue'

export type CashFlowEntryDTO = {
  id: string
  type: CashFlowType
  description: string
  category: string
  amount: number
  entry_date: string
  status: CashFlowStatus
  notes: string | null
}

export type CashFlowDashboard = {
  entries: CashFlowEntryDTO[]
  monthReceivables: number
  monthExpenses: number
  monthBalance: number
  pendingReceivables: number
  pendingExpenses: number
  overdueReceivables: number
  byCategoryExpenses: { category: string; total: number }[]
  byCategoryReceivables: { category: string; total: number }[]
  months: {
    key: string
    label: string
    receivables: number
    expenses: number
  }[]
}

function toDTO(entry: {
  id: string
  type: CashFlowType
  description: string
  category: string
  amount: { toNumber(): number } | number
  entry_date: Date
  status: CashFlowStatus
  notes: string | null
}): CashFlowEntryDTO {
  return {
    id: entry.id,
    type: entry.type,
    description: entry.description,
    category: entry.category,
    amount:
      typeof entry.amount === 'number' ? entry.amount : entry.amount.toNumber(),
    entry_date: entry.entry_date.toISOString(),
    status: entry.status,
    notes: entry.notes,
  }
}

async function ensureOwner() {
  const userId = await requireUserId()
  const owner = await isPlatformOwner()
  if (!owner) {
    throw new Error('FORBIDDEN')
  }
  return userId
}

export async function ensureCashFlowSeedAction(): Promise<void> {
  const userId = await ensureOwner()
  const count = await prisma.cashFlowEntry.count({
    where: { user_id: userId },
  })
  if (count > 0) return

  await prisma.cashFlowEntry.createMany({
    data: [
      ...RECEIVABLE_SEED.map((item) => ({
        user_id: userId,
        type: 'receivable' as const,
        description: item.description,
        category: item.category,
        amount: item.amount,
        entry_date: daysAgoDate(item.daysAgo),
        status: item.status,
      })),
      ...EXPENSE_SEED.map((item) => ({
        user_id: userId,
        type: 'expense' as const,
        description: item.description,
        category: item.category,
        amount: item.amount,
        entry_date: daysAgoDate(item.daysAgo),
        status: item.status,
      })),
    ],
  })
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export async function getCashFlowDashboardAction(): Promise<CashFlowDashboard> {
  const userId = await ensureOwner()
  await ensureCashFlowSeedAction()

  const entries = await prisma.cashFlowEntry.findMany({
    where: { user_id: userId },
    orderBy: [{ entry_date: 'desc' }, { created_at: 'desc' }],
  })

  const dtos = entries.map(toDTO)
  const now = new Date()
  const currentKey = monthKey(now)

  const inCurrentMonth = (iso: string) => monthKey(new Date(iso)) === currentKey

  const monthReceivables = dtos
    .filter((e) => e.type === 'receivable' && inCurrentMonth(e.entry_date))
    .reduce((s, e) => s + e.amount, 0)

  const monthExpenses = dtos
    .filter((e) => e.type === 'expense' && inCurrentMonth(e.entry_date))
    .reduce((s, e) => s + e.amount, 0)

  const pendingReceivables = dtos
    .filter((e) => e.type === 'receivable' && e.status === 'pending')
    .reduce((s, e) => s + e.amount, 0)

  const overdueReceivables = dtos
    .filter((e) => e.type === 'receivable' && e.status === 'overdue')
    .reduce((s, e) => s + e.amount, 0)

  const pendingExpenses = dtos
    .filter((e) => e.type === 'expense' && e.status !== 'paid')
    .reduce((s, e) => s + e.amount, 0)

  const sumByCategory = (type: CashFlowType) => {
    const map = new Map<string, number>()
    for (const e of dtos.filter((x) => x.type === type)) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }

  const monthMap = new Map<string, { receivables: number; expenses: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(d)
    monthMap.set(key, { receivables: 0, expenses: 0 })
  }
  for (const e of dtos) {
    const key = monthKey(new Date(e.entry_date))
    const bucket = monthMap.get(key)
    if (!bucket) continue
    if (e.type === 'receivable') bucket.receivables += e.amount
    else bucket.expenses += e.amount
  }

  return {
    entries: dtos,
    monthReceivables,
    monthExpenses,
    monthBalance: monthReceivables - monthExpenses,
    pendingReceivables,
    pendingExpenses,
    overdueReceivables,
    byCategoryExpenses: sumByCategory('expense'),
    byCategoryReceivables: sumByCategory('receivable'),
    months: Array.from(monthMap.entries()).map(([key, values]) => ({
      key,
      label: monthLabel(key),
      ...values,
    })),
  }
}

export async function createExpenseAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await ensureOwner()
    const parsed = expenseLaunchSchema.safeParse({
      description: formData.get('description'),
      category: formData.get('category'),
      amount: formData.get('amount'),
      entry_date: formData.get('entry_date'),
      status: formData.get('status') || 'paid',
      notes: formData.get('notes') || undefined,
    })

    if (!parsed.success) {
      return actionError('INVALID_INPUT')
    }

    const entryDate = new Date(`${parsed.data.entry_date}T12:00:00`)
    if (Number.isNaN(entryDate.getTime())) {
      return actionError('INVALID_INPUT')
    }

    const entry = await prisma.cashFlowEntry.create({
      data: {
        user_id: userId,
        type: 'expense',
        description: parsed.data.description,
        category: parsed.data.category,
        amount: parsed.data.amount,
        entry_date: entryDate,
        status: parsed.data.status,
        notes: parsed.data.notes || null,
      },
    })

    const hdrs = await headers()
    await logAudit({
      userId,
      operation: 'cash_flow.expense.create',
      entity: 'CashFlowEntry',
      entityId: entry.id,
      ipAddress: getClientIp(hdrs),
    })

    revalidatePath('/internal')
    return { success: true, data: { id: entry.id } }
  } catch {
    return actionError('INTERNAL_ERROR')
  }
}

export async function deleteExpenseAction(
  formData: FormData
): Promise<void> {
  try {
    const userId = await ensureOwner()
    const id = String(formData.get('id') ?? '')
    if (!id) return

    const existing = await prisma.cashFlowEntry.findFirst({
      where: { id, user_id: userId, type: 'expense' },
    })
    if (!existing) return

    await prisma.cashFlowEntry.delete({
      where: { id: existing.id },
    })

    const hdrs = await headers()
    await logAudit({
      userId,
      operation: 'cash_flow.expense.delete',
      entity: 'CashFlowEntry',
      entityId: existing.id,
      ipAddress: getClientIp(hdrs),
    })

    revalidatePath('/internal')
  } catch {
    // silencioso na UI de formulário nativo
  }
}
