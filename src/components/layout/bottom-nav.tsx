'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { dashboardNavItems } from '@/components/layout/nav-items'
import { BRAND } from '@/lib/brand'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className={BRAND.bottomNav}>
      <div className="flex items-center justify-around px-2 py-2">
        {dashboardNavItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                BRAND.bottomNavLink,
                active ? BRAND.bottomNavLinkActive : BRAND.bottomNavLinkInactive
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
