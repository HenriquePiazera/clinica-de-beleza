'use client'

import { Button } from '@/components/ui/button'
import { AuthBrand } from '@/components/layout/auth-brand'
import { BRAND } from '@/lib/brand'
import './globals.css'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <main className={BRAND.authSurface}>
          <div className="relative z-10 mx-auto w-full max-w-md">
            <AuthBrand />
            <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
              <h1 className={BRAND.pageTitle}>Algo deu errado</h1>
              <p className={BRAND.pageDescription}>
                Ocorreu um erro inesperado. Tente novamente.
              </p>
              <Button type="button" onClick={() => reset()} className="mt-6 min-h-11">
                Tentar novamente
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
