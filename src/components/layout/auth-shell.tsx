import { AuthBrand } from '@/components/layout/auth-brand'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'

type AuthShellProps = {
  children: React.ReactNode
  wide?: boolean
}

export function AuthShell({ children, wide = false }: AuthShellProps) {
  return (
    <main className={BRAND.authSurface}>
      <div
        className={cn(
          'relative z-10 mx-auto w-full',
          wide ? 'max-w-lg' : 'max-w-md'
        )}
      >
        <AuthBrand />
        {children}
      </div>
    </main>
  )
}
