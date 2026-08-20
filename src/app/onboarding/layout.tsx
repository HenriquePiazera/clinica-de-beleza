import { AuthShell } from '@/components/layout/auth-shell'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthShell wide>{children}</AuthShell>
}
