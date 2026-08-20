import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'

type ShellHeaderProps = {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  /** default = branco (desktop); sidebar = navy (mobile) */
  tone?: 'default' | 'sidebar'
}

export function ShellHeader({
  children,
  className,
  innerClassName,
  tone = 'default',
}: ShellHeaderProps) {
  return (
    <header
      className={cn(
        tone === 'sidebar' ? BRAND.headerMobile : BRAND.header,
        className
      )}
    >
      <div className={cn(BRAND.headerInner, innerClassName)}>{children}</div>
    </header>
  )
}
