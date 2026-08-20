'use client'

import { Logo } from '@/components/layout/logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dashboardNavItems,
  internalNavItem,
  secondaryNavItems,
} from '@/components/layout/nav-items'
import { logoutAction } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { BrandNavLink } from '@/components/layout/brand-nav-link'
import { BRAND } from '@/lib/brand'

type SidebarNavProps = {
  userName: string
  showInternalLink?: boolean
}

export function SidebarNav({ userName, showInternalLink = false }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <aside className={BRAND.sidebar}>
      <div className="border-b border-sidebar-border px-4 py-3">
        <Logo href="/dashboard" size="sm" variant="full" />
      </div>
      <div className="border-b border-sidebar-border px-4 py-2">
        <p className={BRAND.sidebarUserName}>{userName}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {dashboardNavItems.map((item) => (
          <BrandNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname.startsWith(item.href)}
            theme="sidebar"
          />
        ))}
        {secondaryNavItems.map((item) => (
          <BrandNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname.startsWith(item.href)}
            theme="sidebar"
          />
        ))}
        {showInternalLink ? (
          <BrandNavLink
            href={internalNavItem.href}
            label={internalNavItem.label}
            icon={internalNavItem.icon}
            active={pathname.startsWith(internalNavItem.href)}
            theme="sidebar"
          />
        ) : null}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border p-3">
        <Link
          href="/settings"
          className={cn(
            BRAND.sidebarNavLink,
            pathname.startsWith('/settings')
              ? BRAND.sidebarNavLinkActive
              : BRAND.sidebarNavLinkInactive
          )}
        >
          <Settings className="size-5 shrink-0" />
          <span>Configurações</span>
        </Link>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="min-h-11 w-full border border-sidebar-border text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            Sair
          </Button>
        </form>
      </div>
    </aside>
  )
}
