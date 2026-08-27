import { prisma } from '@/lib/prisma'
import { hasAppointmentConflict } from '@/services/appointment-conflict.service'
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

type AvailabilityBlock = {
  day_of_week: number
  start_time: string
  end_time: string
}

type BusyAppointment = {
  id: string
  start_time: Date
  end_time: Date
  buffer_minutes: number
  status: string
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

function buildSlotsForDay(
  blocks: AvailabilityBlock[],
  dateKey: string,
  durationMinutes: number,
  timeZone: string,
  appointments: BusyAppointment[],
  bufferMinutes: number
): TimeSlot[] {
  const tz = resolveTimeZone(timeZone)
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

      const conflict = hasAppointmentConflict(
        appointments,
        startDate,
        endDate,
        bufferMinutes
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

async function loadAppointmentsInRange(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<BusyAppointment[]> {
  return prisma.appointment.findMany({
    where: {
      user_id: userId,
      status: { not: 'canceled' },
      start_time: { lt: rangeEnd },
      end_time: { gt: rangeStart },
    },
    select: {
      id: true,
      start_time: true,
      end_time: true,
      buffer_minutes: true,
      status: true,
    },
  })
}

export async function getAvailableSlots(
  userId: string,
  dateKey: string,
  durationMinutes: number,
  timeZone = resolveTimeZone(),
  bufferMinutes = 0
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

  const dayStart = buildZonedDateTime(dateKey, '00:00', tz)
  const dayEnd = buildZonedDateTime(dateKey, '23:59', tz)
  const appointments = await loadAppointmentsInRange(userId, dayStart, dayEnd)

  return buildSlotsForDay(
    blocks,
    dateKey,
    durationMinutes,
    tz,
    appointments,
    bufferMinutes
  )
}

export async function getAvailableDates(
  userId: string,
  durationMinutes: number,
  timeZone = resolveTimeZone(),
  daysAhead = 30
): Promise<string[]> {
  const tz = resolveTimeZone(timeZone)
  const blocks = await prisma.availability.findMany({
    where: { user_id: userId, is_active: true },
    select: {
      day_of_week: true,
      start_time: true,
      end_time: true,
    },
  })

  if (blocks.length === 0) {
    return []
  }

  const activeDays = new Set(blocks.map((block) => block.day_of_week))
  const blocksByDay = new Map<number, AvailabilityBlock[]>()

  for (const block of blocks) {
    const list = blocksByDay.get(block.day_of_week) ?? []
    list.push(block)
    blocksByDay.set(block.day_of_week, list)
  }

  let dateKey = getTodayDateKeyInTimeZone(tz)
  const lastDateKey = addDaysToDateKey(dateKey, daysAhead - 1, tz)
  const rangeStart = buildZonedDateTime(dateKey, '00:00', tz)
  const rangeEnd = buildZonedDateTime(lastDateKey, '23:59', tz)
  const appointments = await loadAppointmentsInRange(userId, rangeStart, rangeEnd)

  const dates: string[] = []

  for (let i = 0; i < daysAhead; i++) {
    const dayOfWeek = getDayOfWeekInTimeZone(dateKey, tz)
    const dayBlocks = blocksByDay.get(dayOfWeek)

    if (dayBlocks?.length) {
      const slots = buildSlotsForDay(
        dayBlocks,
        dateKey,
        durationMinutes,
        tz,
        appointments,
        0
      )
      if (slots.length > 0) {
        dates.push(dateKey)
      }
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
