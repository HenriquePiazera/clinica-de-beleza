import Link from 'next/link'
import { ArrowRight, AtSign, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/layout/logo'
import {
  APP_NAME,
  APP_TAGLINE,
  APP_PRESENTATION,
  APP_LOGO_PATH,
  APP_DIFFERENTIALS,
  APP_CONTACT,
} from '@/lib/brand'
import type { LandingClinicData } from '@/features/landing/get-landing-data'

function formatPrice(price: number | null) {
  if (price == null) return null
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type LandingPageProps = {
  isLoggedIn?: boolean
  clinic: LandingClinicData
}

export function LandingPage({ isLoggedIn = false, clinic }: LandingPageProps) {
  const bookingHref = clinic.bookingSlug ? `/p/${clinic.bookingSlug}` : null

  return (
    <div className="min-h-screen bg-[#f7f0eb] text-[#3d1f24]">
      <header className="border-b border-white/10 bg-[#1a1214] text-white">
        <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Logo href="/" size="sm" variant="header" />
          <nav className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button
                asChild
                className="min-h-11 bg-[#b76e79] text-white hover:bg-[#a35f6a]"
              >
                <Link href="/dashboard">
                  Login
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="min-h-11 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">Login</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#1a1214] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(183,110,121,0.2)_0%,_transparent_55%)]" />
          <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-14 text-center sm:py-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={APP_LOGO_PATH}
              alt={APP_NAME}
              className="mb-6 h-auto w-full max-w-[20rem] object-contain sm:max-w-[26rem]"
            />
            <h1 className="sr-only">{APP_NAME}</h1>
            <p className="text-sm font-medium tracking-[0.18em] text-[#c9a07a] uppercase">
              {APP_TAGLINE}
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {APP_PRESENTATION}
            </p>
            <div className="mt-9 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              {bookingHref ? (
                <Button
                  asChild
                  size="lg"
                  className="min-h-11 bg-[#b76e79] text-white hover:bg-[#a35f6a]"
                >
                  <Link href={bookingHref}>Agendar atendimento</Link>
                </Button>
              ) : null}
              {isLoggedIn ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-11 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/dashboard">Login</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-11 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Profissionais + serviços */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Nossa equipe</h2>
            <p className="mt-2 text-sm text-[#7a5a60]">
              Serviços por profissional — atualizados conforme o cadastro do
              salão.
            </p>
          </div>

          {clinic.professionals.length === 0 ? (
            <p className="text-center text-sm text-[#7a5a60]">
              Em breve: profissionais e serviços da clínica.
            </p>
          ) : (
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {clinic.professionals.map((pro) => (
                <li
                  key={pro.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#e0d0c8] bg-white shadow-sm"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-[#1a1214]">
                    {pro.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pro.photo_url}
                        alt={pro.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-light tracking-wide text-[#c9a07a]">
                        {pro.name
                          .split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold">{pro.name}</h3>
                    {pro.bio ? (
                      <p className="mt-1 text-sm text-[#b76e79]">{pro.bio}</p>
                    ) : null}
                    {pro.services.length > 0 ? (
                      <ul className="mt-4 space-y-2 border-t border-[#f0e4de] pt-4">
                        {pro.services.map((service) => (
                          <li
                            key={service.id}
                            className="flex items-baseline justify-between gap-3 text-sm"
                          >
                            <span>{service.name}</span>
                            {formatPrice(service.price) ? (
                              <span className="shrink-0 text-[#7a5a60]">
                                {formatPrice(service.price)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-[#7a5a60]">
                        Serviços em atualização.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Diferenciais */}
        <section className="border-y border-[#e0d0c8] bg-white px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight">
              Por que nos escolher
            </h2>
            <ul className="grid gap-8 sm:grid-cols-3">
              {APP_DIFFERENTIALS.map((item) => (
                <li key={item.title} className="text-center sm:text-left">
                  <h3 className="font-semibold text-[#b76e79]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#7a5a60]">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Depoimentos — mesmo fundo da página, sem alterar o bloco branco dos diferenciais */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              O que dizem nossas clientes
            </h2>
            <p className="mt-2 text-sm text-[#7a5a60]">
              Depoimentos reais, publicados com autorização.
            </p>
          </div>

          {(clinic.reviews ?? []).length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(clinic.reviews ?? []).map((review) => (
                <li
                  key={review.id}
                  className="flex flex-col rounded-2xl border border-[#e0d0c8] bg-white p-5 shadow-sm"
                >
                  <p
                    className="text-[#c9a07a]"
                    aria-label={`${review.rating} de 5 estrelas`}
                  >
                    {'★'.repeat(review.rating)}
                    <span className="text-[#e0d0c8]">
                      {'★'.repeat(5 - review.rating)}
                    </span>
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[#3d1f24]">
                    “{review.message}”
                  </p>
                  <p className="mt-4 text-sm font-semibold text-[#b76e79]">
                    {review.author_name}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-10 flex justify-center">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-11 border-[#b76e79]/40 text-[#3d1f24]"
            >
              <Link href="/avaliar">Deixar depoimento</Link>
            </Button>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Pronta para o seu próximo horário?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#7a5a60]">
            Escolha a profissional e o serviço com poucos toques.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {bookingHref ? (
              <Button
                asChild
                size="lg"
                className="min-h-11 bg-[#b76e79] text-white hover:bg-[#a35f6a]"
              >
                <Link href={bookingHref}>Agendar atendimento</Link>
              </Button>
            ) : null}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-11 border-[#b76e79]/40 text-[#3d1f24]"
            >
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </section>

        {/* Contato */}
        <section className="bg-[#1a1214] px-4 py-14 text-white">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-xl font-semibold tracking-tight text-[#c9a07a]">
              Contato
            </h2>
            <ul className="mx-auto mt-8 flex max-w-lg flex-col gap-4 text-sm text-white/80">
              <li>
                <a
                  href={APP_CONTACT.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-3 rounded-lg px-2 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Phone className="size-4 shrink-0 text-[#c9a07a]" />
                  <span>WhatsApp: {APP_CONTACT.whatsappDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={APP_CONTACT.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-3 rounded-lg px-2 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <AtSign className="size-4 shrink-0 text-[#c9a07a]" />
                  <span>{APP_CONTACT.instagram}</span>
                </a>
              </li>
              <li className="flex min-h-11 items-center gap-3 px-2">
                <MapPin className="size-4 shrink-0 text-[#c9a07a]" />
                <span>{APP_CONTACT.address}</span>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#140e10] px-4 py-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  )
}
