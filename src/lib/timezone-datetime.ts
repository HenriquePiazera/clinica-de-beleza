const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  dayOfWeek: number
}

type ZonedDateTimeTarget = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function getFormatter(timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  })
}

function readPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): number {
  const value = parts.find((part) => part.type === type)?.value ?? '0'
  return Number(value)
}

function weekdayToIndex(value: string): number {
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[value] ?? 0
}

function compareZonedTarget(parts: ZonedParts, target: ZonedDateTimeTarget): number {
  if (parts.year !== target.year) return parts.year - target.year
  if (parts.month !== target.month) return parts.month - target.month
  if (parts.day !== target.day) return parts.day - target.day
  if (parts.hour !== target.hour) return parts.hour - target.hour
  return parts.minute - target.minute
}

export function resolveTimeZone(timeZone?: string | null): string {
  const trimmed = timeZone?.trim()
  return trimmed || DEFAULT_TIMEZONE
}

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = getFormatter(timeZone).formatToParts(date)
  return {
    year: readPart(parts, 'year'),
    month: readPart(parts, 'month'),
    day: readPart(parts, 'day'),
    hour: readPart(parts, 'hour') % 24,
    minute: readPart(parts, 'minute'),
    dayOfWeek: weekdayToIndex(
      parts.find((part) => part.type === 'weekday')?.value ?? 'Sun'
    ),
  }
}

export function formatDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export function parseDateKeyInTimeZone(dateKey: string, timeZone: string): Date {
  return buildZonedDateTime(dateKey, '12:00', timeZone)
}

export function getDayOfWeekInTimeZone(dateKey: string, timeZone: string): number {
  return getZonedParts(parseDateKeyInTimeZone(dateKey, timeZone), timeZone)
    .dayOfWeek
}

export function buildZonedDateTime(
  dateKey: string,
  time: string,
  timeZone: string
): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const target: ZonedDateTimeTarget = { year, month, day, hour, minute }

  let low = Date.UTC(year, month - 1, day - 1, 0, 0, 0)
  let high = Date.UTC(year, month - 1, day + 1, 23, 59, 0)

  for (let attempt = 0; attempt < 40; attempt++) {
    const mid = Math.floor((low + high) / 2)
    const parts = getZonedParts(new Date(mid), timeZone)
    const cmp = compareZonedTarget(parts, target)

    if (cmp === 0) {
      return new Date(mid)
    }

    if (cmp < 0) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return new Date(Math.floor((low + high) / 2))
}

export function isPastDateTimeInTimeZone(date: Date, timeZone: string): boolean {
  void timeZone
  return date.getTime() <= Date.now()
}

export function getTodayDateKeyInTimeZone(timeZone: string): string {
  return formatDateKeyInTimeZone(new Date(), timeZone)
}

export function addDaysToDateKey(dateKey: string, days: number, timeZone: string): string {
  const anchor = buildZonedDateTime(dateKey, '12:00', timeZone)
  const next = new Date(anchor.getTime() + days * 24 * 60 * 60 * 1000)
  return formatDateKeyInTimeZone(next, timeZone)
}
