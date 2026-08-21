import { AuthBrand } from '@/components/layout/auth-brand'
import { BackButton } from '@/components/layout/back-button'
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
        <BackButton href="/" label="Voltar ao início" className="-ml-2 mb-4" />
        <AuthBrand />
        {children}
      </div>
    </main>
  )
}
