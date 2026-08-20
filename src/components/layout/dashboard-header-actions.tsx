'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DashboardHeaderActionsProps = {
  userName: string
  tone?: 'light' | 'dark'
}

function linkClass(
  onDark: boolean,
  active: boolean
): string {
  if (onDark) {
    return cn(
      'h-9 px-1.5 sm:px-2',
      active
        ? 'border border-sidebar-border bg-sidebar-accent text-sidebar-foreground'
        : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
    )
  }

  return cn(
    'h-9 px-2 sm:px-3',
    active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground'
  )
}

export function DashboardHeaderActions({
  userName,
  tone = 'light',
}: DashboardHeaderActionsProps) {
  const pathname = usePathname()
  const onDark = tone === 'dark'

  const feedbackActive = pathname.startsWith('/feedback')
  const settingsActive = pathname.startsWith('/settings')
  const accountActive = pathname.startsWith('/account')

  return (
    <div className="flex items-center gap-0.5 sm:gap-2">
      <span
        className={cn(
          'hidden max-w-[8rem] truncate text-sm lg:inline',
          onDark ? 'text-sidebar-muted' : 'text-muted-foreground'
        )}
      >
        {userName}
      </span>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={linkClass(onDark, feedbackActive)}
      >
        <Link href="/feedback">Feedback</Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={linkClass(onDark, settingsActive)}
      >
        <Link href="/settings">Config</Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={linkClass(onDark, accountActive)}
      >
        <Link href="/account">Conta</Link>
      </Button>
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className={linkClass(onDark, false)}
        >
          Sair
        </Button>
      </form>
    </div>
  )
}
