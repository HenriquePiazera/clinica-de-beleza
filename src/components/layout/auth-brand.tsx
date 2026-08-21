import { Logo } from '@/components/layout/logo'

export function AuthBrand() {
  return (
    <div className="mb-6 flex justify-center">
      <div className="rounded-xl bg-[#1a1214] px-5 py-3 shadow-sm">
        <Logo size="md" href="/" />
      </div>
    </div>
  )
}
