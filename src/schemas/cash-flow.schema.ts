import { z } from 'zod'

export const EXPENSE_CATEGORIES = [
  'Infraestrutura',
  'Insumos',
  'Utilidades',
  'Operacional',
  'Serviços',
  'Marketing',
  'Pessoal',
  'Impostos',
  'Outros',
] as const

export const expenseLaunchSchema = z.object({
  description: z.string().trim().min(2, 'Descreva a despesa').max(200),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  entry_date: z.string().min(1, 'Informe a data'),
  status: z.enum(['paid', 'pending', 'overdue']).default('paid'),
  notes: z.string().trim().max(500).optional(),
})

export type ExpenseLaunchInput = z.infer<typeof expenseLaunchSchema>
