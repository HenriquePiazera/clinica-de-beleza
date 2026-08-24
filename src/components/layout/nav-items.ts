import {
  Calendar,
  Users,
  FileText,
  Wallet,
  LayoutDashboard,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const dashboardNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/appointments', label: 'Agenda', icon: Calendar },
  { href: '/records', label: 'Histórico', icon: FileText },
  { href: '/payments', label: 'Financeiro', icon: Wallet },
]

export const secondaryNavItems: NavItem[] = [
  { href: '/feedback', label: 'Depoimentos', icon: MessageSquare },
]

export const internalNavItem: NavItem = {
  href: '/internal',
  label: 'Fluxo de caixa',
  icon: Wallet,
}
