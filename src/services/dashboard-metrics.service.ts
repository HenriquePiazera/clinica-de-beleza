import { prisma } from '@/lib/prisma'
import { getTeamMemberIds } from '@/lib/team'

const ACTIVE_CLIENT_DAYS = 60

export type DashboardMetrics = {
  totalClients: number
  activeClients: number
  inactiveClients: number
  upcomingAppointments: number
  appointmentsCreated: number
  appointmentsConfirmed: number
  appointmentsCanceled: number
  appointmentsCompleted: number
  attendanceRate: number
  confirmationRate: number
  monthlyRevenue: number
  averageTicket: number
}

export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const userIds = await getTeamMemberIds(userId)
  const activeSince = new Date(Date.now() - ACTIVE_CLIENT_DAYS * 24 * 60 * 60 * 1000)
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [
    totalClients,
    activeClientRows,
    appointments,
    payments,
  ] = await Promise.all([
    prisma.client.count({ where: { user_id: { in: userIds } } }),
    prisma.appointment.findMany({
      where: {
        user_id: { in: userIds },
        status: 'completed',
        start_time: { gte: activeSince },
      },
      select: { client_id: true },
      distinct: ['client_id'],
    }),
    prisma.appointment.findMany({
      where: { user_id: { in: userIds } },
      select: { status: true, start_time: true },
    }),
    prisma.payment.findMany({
      where: {
        user_id: { in: userIds },
        status: 'paid',
        paid_at: { gte: monthStart },
      },
      select: { amount: true },
    }),
  ])

  const activeClients = activeClientRows.length
  const now = new Date()

  const appointmentsCreated = appointments.length
  const appointmentsConfirmed = appointments.filter((a) => a.status === 'confirmed').length
  const appointmentsCanceled = appointments.filter((a) => a.status === 'canceled').length
  const appointmentsCompleted = appointments.filter((a) => a.status === 'completed').length
  const upcomingAppointments = appointments.filter(
    (a) => a.status !== 'canceled' && new Date(a.start_time) >= now
  ).length

  const scheduledTotal = appointments.filter((a) => a.status !== 'canceled').length
  const attendanceRate =
    scheduledTotal > 0
      ? Math.round((appointmentsCompleted / scheduledTotal) * 100)
      : 0

  const awaitingOrConfirmed = appointments.filter((a) =>
    ['awaiting_confirmation', 'confirmed', 'completed'].includes(a.status)
  ).length
  const confirmationRate =
    appointmentsCreated > 0
      ? Math.round((awaitingOrConfirmed / appointmentsCreated) * 100)
      : 0

  const monthlyRevenue = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0)
  const averageTicket =
    payments.length > 0 ? monthlyRevenue / payments.length : 0

  return {
    totalClients,
    activeClients,
    inactiveClients: Math.max(0, totalClients - activeClients),
    upcomingAppointments,
    appointmentsCreated,
    appointmentsConfirmed,
    appointmentsCanceled,
    appointmentsCompleted,
    attendanceRate,
    confirmationRate,
    monthlyRevenue,
    averageTicket,
  }
}
