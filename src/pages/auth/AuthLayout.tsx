import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Leaf, CloudSun, LineChart } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { BrandMark } from '@/components/BrandMark'
import { QuoteBanner } from '@/components/QuoteBanner'
import { useAuth } from '@/contexts/AuthContext'
import { NotConnectedState } from '@/components/ui/States'

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { configured } = useAuth()

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-900 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(224,165,39,0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(74,156,96,0.25),transparent_50%)]" />
        <div className="relative flex items-center gap-2.5">
          <BrandMark size={40} />
          <span className="text-xl font-bold">{t('common.appName')}</span>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight text-white">
            {t('auth.startFarmingSmarter')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Leaf, label: t('nav.cropDoctor') },
              { icon: CloudSun, label: t('nav.weather') },
              { icon: LineChart, label: t('nav.market') },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm backdrop-blur">
                <f.icon size={15} className="text-gold-300" />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl bg-white/10 p-5 backdrop-blur">
          <p className="text-sm leading-relaxed text-white/90">"{t('common.tagline')}"</p>
        </div>
      </div>

      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-2 font-bold text-[var(--text)] lg:hidden">
            <BrandMark size={28} />
            {t('common.appName')}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-10">
          <div className="w-full max-w-sm space-y-6">
            {!configured && <NotConnectedState label="Backend not connected" />}
            {children}
            <div className="lg:hidden">
              <QuoteBanner />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
