'use server'

import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { generateEncryptedDek } from '@/lib/crypto'
import { generatePublicSlug } from '@/lib/slug'
import { logAudit } from '@/lib/audit'
import { isEmailAllowedForBeta } from '@/lib/beta'
import { assertDemoAccessAllowed, isDemoMode } from '@/lib/demo'
import { getAppBaseUrlSync } from '@/lib/app-url'
import { sendPasswordResetEmail } from '@/services/email.service'
import {
  actionError,
  getClientIp,
  type ActionResult,
} from '@/lib/session'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/schemas/auth.schema'
import { signIn, signOut } from '@/auth'

export async function registerAction(
  formData: FormData
): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  const email = parsed.data.email.toLowerCase()
  if (!isEmailAllowedForBeta(email)) {
    return actionError('BETA_INVITE_ONLY')
  }

  const existing = await prisma.user.findFirst({
    where: { email },
  })

  if (existing) {
    return actionError('EMAIL_ALREADY_EXISTS')
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const encryptedDek = generateEncryptedDek()
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      password_hash: passwordHash,
      encrypted_dek: encryptedDek,
      public_slug: generatePublicSlug(parsed.data.name),
      plan: 'trial',
      plan_status: 'trialing',
      trial_ends_at: trialEndsAt,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId: user.id,
    operation: 'user.register',
    entity: 'User',
    entityId: user.id,
    ipAddress: getClientIp(hdrs),
  })

  return { success: true, data: { userId: user.id } }
}

export async function loginFormAction(formData: FormData): Promise<void> {
  const result = await loginAction(formData)
  if (!result.success) {
    redirect('/login?error=1')
  }

  const email = String(formData.get('email')).toLowerCase()

  if (isDemoMode()) {
    const demoOk = await assertDemoAccessAllowed(email)
    if (!demoOk) {
      await signOut({ redirect: false })
      redirect('/demo-expired')
    }
  }

  const user = await prisma.user.findFirst({
    where: { email },
    select: { onboarding_completed_at: true },
  })

  if (!user?.onboarding_completed_at) {
    redirect('/onboarding')
  }

  redirect('/dashboard')
}

export async function loginAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    })
    return { success: true }
  } catch {
    return actionError('INVALID_CREDENTIALS')
  }
}

export async function logoutAction(): Promise<void> {
  const hdrs = await headers()
  const { auth } = await import('@/auth')
  const session = await auth()

  if (session?.user?.id) {
    await logAudit({
      userId: session.user.id,
      operation: 'user.logout',
      entity: 'User',
      entityId: session.user.id,
      ipAddress: getClientIp(hdrs),
    })
  }

  await signOut({ redirectTo: '/login' })
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<ActionResult<{ resetUrl?: string }>> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email.toLowerCase() },
  })

  if (!user) {
    return { success: true }
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.deleteMany({ where: { user_id: user.id } })
  await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token,
      expires_at: expiresAt,
    },
  })

  const baseUrl = getAppBaseUrlSync()
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  const emailResult = await sendPasswordResetEmail({
    to: user.email,
    userName: user.name,
    resetUrl,
  })

  if (!emailResult.sent && process.env.NODE_ENV === 'development') {
    console.log('[DEV] Link de recuperação:', resetUrl)
  }

  return {
    success: true,
    data: process.env.NODE_ENV === 'development' ? { resetUrl } : undefined,
  }
}

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      token: parsed.data.token,
      expires_at: { gt: new Date() },
    },
  })

  if (!resetToken) {
    return actionError('PASSWORD_RESET_INVALID')
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.user_id },
      data: { password_hash: passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
  ])

  return { success: true }
}

export async function registerAndLoginAction(formData: FormData): Promise<void> {
  const result = await registerAction(formData)
  if (!result.success) {
    redirect(`/register?errorCode=${result.errorCode ?? 'INVALID_INPUT'}`)
  }

  const loginResult = await loginAction(formData)
  if (!loginResult.success) {
    redirect('/login')
  }

  redirect('/onboarding')
}
