import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { ErrorState, LoadingState } from '@/components/ui/States'
import { fetchNationalPrices, type NationalPrice } from '@/lib/marketApi'

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-500" />
  if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />
  return <Minus size={14} className="text-[var(--text-muted)]" />
}

export default function Market() {
  const { t } = useTranslation()
  const [prices, setPrices] = useState<NationalPrice[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNationalPrices()
      .then(setPrices)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title={t('market.title')} subtitle={t('market.nationalPrices')} />

      {loading ? (
        <Card>
          <LoadingState />
        </Card>
      ) : error || !prices ? (
        <Card>
          <ErrorState message={error ?? undefined} />
        </Card>
      ) : (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text)]">{t('market.nationalPrices')}</h2>
            <span className="text-xs text-[var(--text-muted)]">{t('market.sourceAttribution')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {prices.map((p) => (
              <div key={p.id} className="rounded-xl bg-[var(--surface-muted)] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text)]">
                    {p.icon} {p.name}
                  </span>
                  <TrendIcon trend={p.trend} />
                </div>
                <p className="text-base font-bold text-[var(--text)]">
                  ₹{p.price}
                  <span className="text-xs font-normal text-[var(--text-muted)]">/{p.unit}</span>
                </p>
                {p.msp !== null && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {t('market.msp')}: ₹{p.msp}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
