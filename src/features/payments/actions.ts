'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import {
  actionError,
  getClientIp,
  requireUserId,
  type ActionResult,
} from '@/lib/session'
import { paymentSchema } from '@/schemas/payment.schema'
import {
  formatReceiptAddress,
  formatReceiptNumber,
  formatTaxId,
  type ReceiptAddressParts,
} from '@/lib/receipt'
import { getPaymentMethodLabel } from '@/lib/payment-labels'

export type PaymentDTO = {
  id: string
  client_id: string
  client_name: string
  appointment_id: string | null
  amount: number
  payment_method: string
  status: string
  paid_at: string | null
  created_at: string
}

export async function listPaymentsAction(): Promise<PaymentDTO[]> {
  const userId = await requireUserId()
  const payments = await prisma.payment.findMany({
    where: { user_id: userId },
    include: { client: { select: { name: true } } },
    orderBy: { created_at: 'desc' },
  })

  return payments.map((p) => ({
    id: p.id,
    client_id: p.client_id,
    client_name: p.client.name,
    appointment_id: p.appointment_id,
    amount: Number(p.amount),
    payment_method: p.payment_method,
    status: p.status,
    paid_at: p.paid_at?.toISOString() ?? null,
    created_at: p.created_at.toISOString(),
  }))
}

export async function createPaymentAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId()
  const parsed = paymentSchema.safeParse({
    client_id: formData.get('client_id'),
    appointment_id: formData.get('appointment_id') || undefined,
    amount: formData.get('amount'),
    payment_method: formData.get('payment_method'),
    status: formData.get('status') ?? 'pending',
    paid_at: formData.get('paid_at') || undefined,
  })

  if (!parsed.success) return actionError('INVALID_INPUT')

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.client_id, user_id: userId },
  })
  if (!client) return actionError('CLIENT_NOT_FOUND')

  const payment = await prisma.payment.create({
    data: {
      user_id: userId,
      client_id: parsed.data.client_id,
      appointment_id: parsed.data.appointment_id ?? null,
      amount: parsed.data.amount,
      payment_method: parsed.data.payment_method,
      status: parsed.data.status,
      paid_at:
        parsed.data.status === 'paid'
          ? parsed.data.paid_at
            ? new Date(parsed.data.paid_at)
            : new Date()
          : null,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'payment.create',
    entity: 'Payment',
    entityId: payment.id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/payments')
  return { success: true, data: { id: payment.id } }
}

export async function deletePaymentAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.payment.findFirst({
    where: { id, user_id: userId },
  })
  if (!existing) return actionError('PAYMENT_NOT_FOUND')

  await prisma.payment.delete({ where: { id } })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'payment.delete',
    entity: 'Payment',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/payments')
  return { success: true }
}

export type PaymentReceiptDTO = {
  id: string
  receipt_label: string
  issued_at: string
  paid_at: string
  amount: number
  payment_method_label: string
  reference_description: string
  professional: {
    name: string
    tax_id: string | null
    address: string | null
  }
  client: {
    name: string
  }
}

export async function getPaymentReceiptAction(
  paymentId: string
): Promise<ActionResult<PaymentReceiptDTO>> {
  const userId = await requireUserId()

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, user_id: userId },
    include: {
      client: { select: { name: true } },
      appointment: {
        select: {
          service: { select: { name: true } },
        },
      },
      user: {
        select: {
          name: true,
          receipt_tax_id: true,
          receipt_street: true,
          receipt_address_number: true,
          receipt_complement: true,
          receipt_neighborhood: true,
          receipt_city: true,
          receipt_state: true,
          receipt_postal_code: true,
        },
      },
    },
  })

  if (!payment) return actionError('PAYMENT_NOT_FOUND')
  if (payment.status !== 'paid') return actionError('RECEIPT_NOT_PAID')

  let receiptNumber = payment.receipt_number
  let issuedAt = payment.receipt_issued_at ?? payment.paid_at ?? payment.created_at

  if (!receiptNumber) {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.payment.findFirst({
        where: { id: paymentId, user_id: userId, status: 'paid' },
      })
      if (!current) return null
      if (current.receipt_number) return current

      const user = await tx.user.update({
        where: { id: userId },
        data: { receipt_counter: { increment: 1 } },
        select: { receipt_counter: true },
      })

      return tx.payment.update({
        where: { id: paymentId },
        data: {
          receipt_number: user.receipt_counter,
          receipt_issued_at: new Date(),
        },
      })
    })

    if (!updated) return actionError('PAYMENT_NOT_FOUND')

    receiptNumber = updated.receipt_number
    issuedAt = updated.receipt_issued_at ?? updated.paid_at ?? updated.created_at

    const hdrs = await headers()
    await logAudit({
      userId,
      operation: 'payment.receipt.issue',
      entity: 'Payment',
      entityId: paymentId,
      ipAddress: getClientIp(hdrs),
    })
  }

  if (!receiptNumber || !issuedAt) return actionError('INTERNAL_ERROR')

  const addressParts: ReceiptAddressParts = {
    street: payment.user.receipt_street,
    number: payment.user.receipt_address_number,
    complement: payment.user.receipt_complement,
    neighborhood: payment.user.receipt_neighborhood,
    city: payment.user.receipt_city,
    state: payment.user.receipt_state,
    postalCode: payment.user.receipt_postal_code,
  }

  const serviceName = payment.appointment?.service?.name
  const referenceDescription = serviceName
    ? `serviços de ${serviceName}`
    : 'serviços prestados'

  const paidAt = payment.paid_at ?? payment.created_at

  return {
    success: true,
    data: {
      id: payment.id,
      receipt_label: formatReceiptNumber(receiptNumber, issuedAt),
      issued_at: issuedAt.toISOString(),
      paid_at: paidAt.toISOString(),
      amount: Number(payment.amount),
      payment_method_label: getPaymentMethodLabel(payment.payment_method),
      reference_description: referenceDescription,
      professional: {
        name: payment.user.name,
        tax_id: formatTaxId(payment.user.receipt_tax_id),
        address: formatReceiptAddress(addressParts),
      },
      client: {
        name: payment.client.name,
      },
    },
  }
}
