import Link from 'next/link'
import { cn } from '@/lib/utils'
import { APP_LOGO_PATH, APP_NAME } from '@/lib/brand'

type LogoProps = {
  href?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** full = imagem PNG; compact = texto; header = PNG compacto para barra mobile */
  variant?: 'full' | 'compact' | 'header'
  className?: string
}

const fullSizeClasses = {
  sm: 'max-h-16 w-full max-w-[16rem]',
  md: 'max-h-20 w-full max-w-[22rem]',
  lg: 'max-h-24 w-full max-w-[28rem]',
  xl: 'max-h-28 w-full max-w-[32rem]',
} as const

const headerSizeClasses = 'max-h-10 w-auto max-w-[14rem]'

const compactNameClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
} as const

export function Logo({
  href = '/',
  size = 'md',
  variant = 'full',
  className,
}: LogoProps) {
  const mark =
    variant === 'full' ? (
      // eslint-disable-next-line @next/next/no-img-element -- PNG com texto; next/image quebra SVG/texto
      <img
        src={APP_LOGO_PATH}
        alt={APP_NAME}
        className={cn('object-contain object-left', fullSizeClasses[size], className)}
      />
    ) : variant === 'header' ? (
      <img
        src={APP_LOGO_PATH}
        alt={APP_NAME}
        className={cn('object-contain object-left', headerSizeClasses, className)}
      />
    ) : (
      <div className={cn('flex flex-col leading-tight', className)}>
        <span
          className={cn(
            'font-bold tracking-tight text-primary',
            compactNameClasses[size]
          )}
        >
          {APP_NAME}
        </span>
      </div>
    )

  if (!href) {
    return mark
  }

  return (
    <Link href={href} className="inline-flex shrink-0 items-center no-underline">
      {mark}
    </Link>
  )
}
