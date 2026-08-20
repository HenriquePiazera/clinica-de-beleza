/** Formato YYYY-MM-DD no fuso local do servidor. */
export function formatLocalDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Converte YYYY-MM-DD para Date ao meio-dia local (evita mudança de dia por UTC). */
export function parseLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

/** Monta Date local a partir de YYYY-MM-DD e HH:MM. */
export function buildLocalDateTime(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export function isPastDateTime(value: Date): boolean {
  return value.getTime() <= Date.now()
}

/** Converte ISO string para valor de input datetime-local (timezone local). */
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function getMinDatetimeLocalValue(): string {
  return toDatetimeLocalValue(new Date().toISOString())
}
