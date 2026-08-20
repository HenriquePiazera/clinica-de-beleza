import { prisma } from '@/lib/prisma'
import { checkAppointmentConflict } from '@/services/appointment-conflict.service'
import {
  addDaysToDateKey,
  buildZonedDateTime,
  formatDateKeyInTimeZone,
  getDayOfWeekInTimeZone,
  getTodayDateKeyInTimeZone,
  isPastDateTimeInTimeZone,
  resolveTimeZone,
} from '@/lib/timezone-datetime'

export type TimeSlot = {
  start: string
  end: string
}

function parseTimeToMinutes(time: string): number {
  const normalized = time.slice(0, 5)
  const [hours, minutes] = normalized.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export async function getAvailableSlots(
  userId: string,
  dateKey: string,
  durationMinutes: number,
  timeZone = resolveTimeZone()
): Promise<TimeSlot[]> {
  const tz = resolveTimeZone(timeZone)
  const dayOfWeek = getDayOfWeekInTimeZone(dateKey, tz)

  const blocks = await prisma.availability.findMany({
    where: {
      user_id: userId,
      day_of_week: dayOfWeek,
      is_active: true,
    },
    orderBy: { start_time: 'asc' },
  })

  if (blocks.length === 0) {
    return []
  }

  const slots: TimeSlot[] = []
  const slotStepMinutes = Math.min(durationMinutes, 30)

  for (const block of blocks) {
    const blockStart = parseTimeToMinutes(block.start_time)
    const blockEnd = parseTimeToMinutes(block.end_time)

    for (
      let minute = blockStart;
      minute + durationMinutes <= blockEnd;
      minute += slotStepMinutes
    ) {
      const startTime = minutesToTime(minute)
      const endTime = minutesToTime(minute + durationMinutes)

      const startDate = buildZonedDateTime(dateKey, startTime, tz)
      const endDate = buildZonedDateTime(dateKey, endTime, tz)

      if (isPastDateTimeInTimeZone(startDate, tz)) {
        continue
      }

      const conflict = await checkAppointmentConflict(
        userId,
        startDate,
        endDate,
        0
      )

      if (!conflict.hasConflict) {
        slots.push({
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        })
      }
    }
  }

  return slots
}

export async function getAvailableDates(
  userId: string,
  durationMinutes: number,
  timeZone = resolveTimeZone(),
  daysAhead = 30
): Promise<string[]> {
  const tz = resolveTimeZone(timeZone)
  const dates: string[] = []
  let dateKey = getTodayDateKeyInTimeZone(tz)

  for (let i = 0; i < daysAhead; i++) {
    const slots = await getAvailableSlots(userId, dateKey, durationMinutes, tz)
    if (slots.length > 0) {
      dates.push(dateKey)
    }
    dateKey = addDaysToDateKey(dateKey, 1, tz)
  }

  return dates
}

export async function isSlotAvailable(
  userId: string,
  startTime: Date,
  durationMinutes: number,
  timeZone = resolveTimeZone()
): Promise<boolean> {
  const tz = resolveTimeZone(timeZone)
  const dateKey = formatDateKeyInTimeZone(startTime, tz)
  const slots = await getAvailableSlots(userId, dateKey, durationMinutes, tz)
  return slots.some((slot) => new Date(slot.start).getTime() === startTime.getTime())
}
