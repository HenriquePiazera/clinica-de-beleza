import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isPlatformOwnerEmail } from '@/lib/platform-owner'
import { Logo } from '@/components/layout/logo'
import { InternalMobileNav, InternalNav } from '@/components/layout/internal-nav'
import { ShellHeader } from '@/components/layout/shell-header'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!isPlatformOwnerEmail(session.user.email)) redirect('/dashboard')

  const userName = session.user.name ?? 'Dono'

  return (
    <div className={cn(BRAND.surface, 'md:flex')}>
      <InternalNav userName={userName} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <ShellHeader className="md:hidden">
          <Logo href="/internal" size="sm" variant="compact" />
          <Link href="/dashboard" className="text-primary text-sm hover:underline">
            Voltar ao app
          </Link>
        </ShellHeader>

        <ShellHeader className="hidden md:block">
          <div aria-hidden className="flex-1" />
          <Link href="/dashboard" className="text-primary text-sm hover:underline">
            Voltar ao app
          </Link>
        </ShellHeader>

        <InternalMobileNav />
        <div className={BRAND.content}>{children}</div>
      </div>
    </div>
  )
}
