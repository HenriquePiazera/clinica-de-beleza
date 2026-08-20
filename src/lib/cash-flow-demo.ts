export function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export const RECEIVABLE_SEED = [
  {
    description: 'Consulta — Ana Souza',
    category: 'Atendimentos',
    amount: 180,
    daysAgo: 0,
    status: 'paid' as const,
  },
  {
    description: 'Pacote 4 sessões — Bruno Lima',
    category: 'Pacotes',
    amount: 640,
    daysAgo: 1,
    status: 'paid' as const,
  },
  {
    description: 'Avaliação inicial — Carla Mendes',
    category: 'Atendimentos',
    amount: 220,
    daysAgo: 2,
    status: 'pending' as const,
  },
  {
    description: 'Retorno — Diego Alves',
    category: 'Atendimentos',
    amount: 150,
    daysAgo: 3,
    status: 'overdue' as const,
  },
  {
    description: 'Tratamento mensal — Elena Costa',
    category: 'Planos',
    amount: 890,
    daysAgo: 4,
    status: 'paid' as const,
  },
  {
    description: 'Consulta — Fernanda Rocha',
    category: 'Atendimentos',
    amount: 180,
    daysAgo: 5,
    status: 'paid' as const,
  },
  {
    description: 'Sessão estética — Gabriela Nunes',
    category: 'Estética',
    amount: 320,
    daysAgo: 6,
    status: 'paid' as const,
  },
  {
    description: 'Pacote mensal — Hugo Martins',
    category: 'Planos',
    amount: 720,
    daysAgo: 8,
    status: 'pending' as const,
  },
]

export const EXPENSE_SEED = [
  {
    description: 'Aluguel da sala',
    category: 'Infraestrutura',
    amount: 3200,
    daysAgo: 0,
    status: 'paid' as const,
  },
  {
    description: 'Material descartável',
    category: 'Insumos',
    amount: 480,
    daysAgo: 6,
    status: 'paid' as const,
  },
  {
    description: 'Energia elétrica',
    category: 'Utilidades',
    amount: 610,
    daysAgo: 8,
    status: 'paid' as const,
  },
  {
    description: 'Software e internet',
    category: 'Operacional',
    amount: 290,
    daysAgo: 10,
    status: 'pending' as const,
  },
  {
    description: 'Limpeza e manutenção',
    category: 'Serviços',
    amount: 750,
    daysAgo: 13,
    status: 'paid' as const,
  },
  {
    description: 'Marketing digital',
    category: 'Marketing',
    amount: 950,
    daysAgo: 18,
    status: 'paid' as const,
  },
]

export function daysAgoDate(daysAgo: number): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d
}
