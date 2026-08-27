export const APP_NAME = 'Clínica de Beleza Mariana Oliveira'

export const APP_TAGLINE = 'Estética • Beleza • Bem-estar'

export const APP_SLOGAN =
  'Cuidado personalizado em estética, beleza e bem-estar'

export const APP_PRESENTATION =
  'Um espaço acolhedor para cuidar da sua pele, sobrancelhas e unhas, com atendimento individual e agenda organizada para cada profissional.'

/** Aviso global em portfólio / demonstração. */
export const FICTITIOUS_DATA_NOTICE =
  'Todos os dados exibidos neste site são fictícios, apenas para demonstração.'

export const FICTITIOUS_REVIEWS_NOTICE =
  'Depoimentos fictícios, criados para demonstração do sistema.'

export const APP_LOGO_PATH = '/logo-clinica-mariana-oliveira.png?v=1'

/** Diferenciais exibidos na landing (texto editorial). */
export const APP_DIFFERENTIALS = [
  {
    title: 'Atendimento personalizado',
    description:
      'Cada profissional com sua agenda e foco no seu momento de cuidado.',
  },
  {
    title: 'Equipe especializada',
    description:
      'Estética, sobrancelhas e manicure/pedicure em um só lugar.',
  },
  {
    title: 'Agenda prática',
    description:
      'Agende online com praticidade e receba lembretes no momento certo.',
  },
] as const

/** Contato exibido na landing (ajuste quando o cliente enviar os dados reais). */
export const APP_CONTACT = {
  whatsappDisplay: '(11) 90000-0000',
  whatsappLink: 'https://wa.me/5511900000000',
  instagram: '@clinicamarianaoliveira',
  instagramLink: 'https://instagram.com/clinicamarianaoliveira',
  address: 'São Paulo, SP — endereço a confirmar',
} as const

/** Classes Tailwind/CSS compartilhadas — identidade visual do app */
export const BRAND = {
  surface: 'brand-surface',
  authSurface: 'brand-auth-surface',
  header: 'brand-header',
  headerMobile: 'brand-header-mobile',
  headerInner: 'brand-header-inner',
  content: 'brand-content',
  contentNarrow: 'brand-content-narrow',
  contentWide: 'brand-content-wide',
  sidebarUserName: 'brand-sidebar-user',
  sidebar: 'brand-sidebar',
  navLink: 'brand-nav-link',
  navLinkActive: 'brand-nav-link-active',
  navLinkInactive: 'brand-nav-link-inactive',
  sidebarNavLink: 'brand-sidebar-nav-link',
  sidebarNavLinkActive: 'brand-sidebar-nav-link-active',
  sidebarNavLinkInactive: 'brand-sidebar-nav-link-inactive',
  bottomNavLink: 'brand-bottom-nav-link',
  bottomNav: 'brand-bottom-nav',
  bottomNavLinkActive: 'brand-bottom-nav-link-active',
  bottomNavLinkInactive: 'brand-bottom-nav-link-inactive',
  pageTitle: 'brand-page-title',
  pageDescription: 'brand-page-description',
  hero: 'brand-hero',
  sectionMuted: 'brand-section-muted',
  internalBadge: 'brand-internal-badge',
} as const
