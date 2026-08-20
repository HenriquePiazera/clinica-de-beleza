export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  awaiting_confirmation: 'Aguardando confirmação',
  confirmed: 'Confirmado',
  completed: 'Realizado',
  canceled: 'Cancelado',
}

export const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial (14 dias)',
  solo: 'Solo',
  professional: 'Profissional',
  team: 'Equipe',
}

export const PLAN_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelado',
  trialing: 'Período de teste',
}

export const FEEDBACK_CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug / problema',
  suggestion: 'Sugestão',
  praise: 'Elogio',
  difficulty: 'Dificuldade de uso',
}

export const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  reviewed: 'Revisado',
  archived: 'Arquivado',
}

export const selectFieldClassName =
  'border-input bg-background flex min-h-11 w-full rounded-md border px-3 text-sm'
