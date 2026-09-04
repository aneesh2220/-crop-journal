import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Sprout } from 'lucide-react'
import { getRandomQuote, getQuoteText } from '@/data/quotes'

export function QuoteBanner({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  // Rotate deterministically by day so it doesn't jump on every re-render.
  const seed = useMemo(() => Math.floor(Date.now() / (1000 * 60 * 60 * 24)), [])
  const quote = useMemo(() => getRandomQuote(seed), [seed])

  return (
    <div className={`card flex items-start gap-3 border-brand-200/60 bg-gradient-to-br from-brand-50 to-gold-50 p-5 dark:border-brand-800/40 dark:from-brand-900/20 dark:to-gold-900/10 ${className ?? ''}`}>
      <div className="mt-0.5 rounded-full bg-brand-600 p-2 text-white">
        <Sprout size={16} />
      </div>
      <div>
        <p className="text-sm font-medium leading-relaxed text-[var(--text)]">
          “{getQuoteText(quote, i18n.language)}”
        </p>
        {quote.author && <p className="mt-1 text-xs text-[var(--text-muted)]">— {quote.author}</p>}
      </div>
    </div>
  )
}
