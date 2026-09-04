import {
  LayoutDashboard,
  MessageCircleHeart,
  Stethoscope,
  FlaskConical,
  Sprout,
  Droplets,
  CloudSun,
  LineChart,
  Satellite,
  Tractor,
  TrendingUp,
  ListChecks,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/chat', labelKey: 'nav.chat', icon: MessageCircleHeart },
  { to: '/crop-doctor', labelKey: 'nav.cropDoctor', icon: Stethoscope },
  { to: '/soil-health', labelKey: 'nav.soilHealth', icon: FlaskConical },
  { to: '/crop-suggestions', labelKey: 'nav.cropSuggestions', icon: Sprout },
  { to: '/irrigation', labelKey: 'nav.irrigation', icon: Droplets },
  { to: '/weather', labelKey: 'nav.weather', icon: CloudSun },
  { to: '/market', labelKey: 'nav.market', icon: LineChart },
  { to: '/field-view', labelKey: 'nav.fieldView', icon: Satellite },
  { to: '/my-farm', labelKey: 'nav.myFarm', icon: Tractor },
  { to: '/farm-progress', labelKey: 'nav.farmProgress', icon: TrendingUp },
  { to: '/tasks', labelKey: 'nav.tasks', icon: ListChecks },
  { to: '/notifications', labelKey: 'nav.notifications', icon: Bell },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

// Primary items pinned to the mobile bottom bar; everything else lives behind "More".
export const MOBILE_PRIMARY_COUNT = 4
