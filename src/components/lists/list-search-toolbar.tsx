'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { selectFieldClassName } from '@/lib/labels'

export type SortOrder = 'asc' | 'desc'

type Props = {
  nameQuery: string
  onNameQueryChange: (value: string) => void
  dateFilter: string
  onDateFilterChange: (value: string) => void
  sortOrder: SortOrder
  onSortOrderChange: (value: SortOrder) => void
  namePlaceholder?: string
}

export function ListSearchToolbar({
  nameQuery,
  onNameQueryChange,
  dateFilter,
  onDateFilterChange,
  sortOrder,
  onSortOrderChange,
  namePlaceholder = 'Nome da cliente',
}: Props) {
  const hasFilters = Boolean(nameQuery || dateFilter)

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="space-y-2">
          <Label htmlFor="list-search-name">Buscar por nome</Label>
          <Input
            id="list-search-name"
            value={nameQuery}
            onChange={(e) => onNameQueryChange(e.target.value)}
            placeholder={namePlaceholder}
            className="min-h-11"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="list-search-date">Filtrar por data</Label>
          <Input
            id="list-search-date"
            type="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="list-sort">Ordenar por data</Label>
          <select
            id="list-sort"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
            className={selectFieldClassName}
          >
            <option value="asc">Crescente (mais antigo → recente)</option>
            <option value="desc">Decrescente (mais recente → antigo)</option>
          </select>
        </div>
        {hasFilters ? (
          <button
            type="button"
            className="text-primary min-h-11 text-sm font-medium underline-offset-2 hover:underline"
            onClick={() => {
              onNameQueryChange('')
              onDateFilterChange('')
            }}
          >
            Limpar filtros
          </button>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function matchesLocalDate(iso: string, dateKey: string): boolean {
  if (!dateKey) return true
  const local = new Date(iso)
  const y = local.getFullYear()
  const m = String(local.getMonth() + 1).padStart(2, '0')
  const d = String(local.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}` === dateKey
}
