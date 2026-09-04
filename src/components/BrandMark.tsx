/**
 * The AgroAI logo. This is the single source of truth for the mark — it must stay
 * identical to public/favicon.svg and the exported PNGs in brand/, because those are
 * what the social media profiles use. Don't substitute a lucide icon for it anywhere
 * the app is identifying itself; a different symbol on the site than on Instagram
 * reads as a different product.
 */
export function BrandMark({
  size = 32,
  variant = 'tile',
  className,
}: {
  size?: number
  /** `tile` = leaf on the dark rounded square (default). `bare` = leaf only, transparent. */
  variant?: 'tile' | 'bare'
  className?: string
}) {
  const gradientId = `agroai-mark-bg-${variant}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="AgroAI"
    >
      {variant === 'tile' && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a4d2e" />
              <stop offset="100%" stopColor="#0f3020" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
        </>
      )}
      <path d="M18 42c0-14 10-24 26-24 0 16-10 26-26 26z" fill="#4a9c60" />
      <path
        d="M18 44c8-8 14-14 26-26"
        stroke="#e0a527"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
