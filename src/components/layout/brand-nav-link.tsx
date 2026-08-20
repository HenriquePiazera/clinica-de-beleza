import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'

type BrandNavLinkProps = {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  active?: boolean
  className?: string
  theme?: 'light' | 'sidebar'
}

export function BrandNavLink({
  href,
  label,
  icon: Icon,
  active = false,
  className,
  theme = 'light',
}: BrandNavLinkProps) {
  const linkClass =
    theme === 'sidebar' ? BRAND.sidebarNavLink : BRAND.navLink
  const activeClass =
    theme === 'sidebar' ? BRAND.sidebarNavLinkActive : BRAND.navLinkActive
  const inactiveClass =
    theme === 'sidebar' ? BRAND.sidebarNavLinkInactive : BRAND.navLinkInactive

  return (
    <Link
      href={href}
      className={cn(
        linkClass,
        active ? activeClass : inactiveClass,
        className
      )}
    >
      {Icon ? <Icon className="size-5 shrink-0" /> : null}
      <span>{label}</span>
    </Link>
  )
}
