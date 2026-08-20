export type SearchParamsWithRefresh = {
  refreshed?: string | string[]
  [key: string]: string | string[] | undefined
}

export function formKeyFromSearchParams(
  searchParams?: SearchParamsWithRefresh | null
): string {
  const value = searchParams?.refreshed
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? 'initial'
  return 'initial'
}
