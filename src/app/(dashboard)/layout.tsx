import { Logo } from '@/components/layout/logo'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { assertDemoAccessAllowed } from '@/lib/demo'
import { isPlatformOwnerEmail } from '@/lib/platform-owner'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { ShellHeader } from '@/components/layout/shell-header'
import { DemoBanner } from '@/components/demo/demo-banner'
import { DashboardHeaderActions } from '@/components/layout/dashboard-header-actions'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const demoOk = await assertDemoAccessAllowed(session.user.email)
  if (!demoOk) redirect('/demo-expired')

  const showInternalLink = isPlatformOwnerEmail(session.user.email)
  const userName = session.user.name ?? 'Usuário'

  return (
    <div className={cn(BRAND.surface, 'md:flex')}>
      <SidebarNav
        userName={userName}
        showInternalLink={showInternalLink}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <DemoBanner email={session.user.email} />
        <ShellHeader className="md:hidden" tone="sidebar">
          <Logo href="/dashboard" variant="header" />
          <DashboardHeaderActions userName={userName} tone="dark" />
        </ShellHeader>

        <ShellHeader className="hidden md:block">
          <div aria-hidden className="flex-1" />
          <DashboardHeaderActions userName={userName} />
        </ShellHeader>

        <div className={BRAND.content}>{children}</div>
        <BottomNav />
      </div>
    </div>
  )
}
