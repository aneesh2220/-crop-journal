/**
 * The AgroAI logo. Single source of truth for the mark — it must stay identical to
 * public/favicon.svg and the exported PNGs in brand/, because those are what the
 * social profiles and the phone home-screen icon use. Don't substitute an icon-font
 * glyph for it anywhere the app identifies itself.
 *
 * Two things this handles that a flat export can't:
 *
 * 1. Contrast. The logo's deepest green (#1B5E20) is designed for white paper and
 *    all but vanishes against the app's dark ground (#0e1c14). The bowl and circuit
 *    colours come from CSS variables that lighten in dark mode, so the mark stays
 *    legible on both themes without shipping two files.
 *
 * 2. Detail at small sizes. The circuit traces and the hairline vein are ~1px of
 *    artwork; below about 34px they collapse into noise and just muddy the
 *    silhouette. They're dropped automatically at those sizes, which is what makes
 *    the 22px sidebar mark still read as leaves-in-a-bowl.
 */
export function BrandMark({
  size = 32,
  variant = 'full',
  className,
}: {
  size?: number
  /** `full` draws the whole mark. `bare` omits the sun, for tight inline lockups. */
  variant?: 'full' | 'bare'
  className?: string
}) {
  // Below this, fine detail costs legibility rather than adding to it.
  const detailed = size >= 34

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="AgroAI"
    >
      {variant === 'full' && <circle cx="52" cy="12" r="6" fill="#FFB81C" />}

      {detailed && (
        <>
          <g
            stroke="var(--mark-circuit, #2E7D32)"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M38 24 H45 L49 20 H55" />
            <path d="M40 30 H48 L52 26 H58" />
          </g>
          <g fill="var(--mark-circuit, #2E7D32)">
            <circle cx="56.6" cy="20" r="2.6" />
            <circle cx="59.4" cy="26" r="2.6" />
          </g>
        </>
      )}

      {/* sprouting leaves */}
      <path d="M27 35 C25 24 21 18 14 14 C12.5 24.5 16.5 32.5 27 35 Z" fill="var(--mark-circuit, #2E7D32)" />
      <path d="M29 35 C30 23 34.5 16 41 13 C43 24 38 33 29 35 Z" fill="#4CAF50" />
      {detailed && (
        <path
          d="M29.5 35 C28.8 26.5 30.2 20 34 15.5"
          stroke="#F1F8E9"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* bowl */}
      <path d="M5 34 C5 46.6 15.3 57 28 57 C40.7 57 51 46.6 51 34 Z" fill="var(--mark-deep, #1B5E20)" />

      {/* light field sweep */}
      <path d="M7 37 C14.5 51 33 54.5 47.5 43.5 C39 35.5 21 33 7 37 Z" fill="#66BB6A" />
      <path
        d="M7.5 41 C16.5 50.5 31.5 52 43.5 44.5"
        stroke="#F1F8E9"
        strokeWidth="2.1"
        fill="none"
        strokeLinecap="round"
      />
      {detailed && (
        <path
          d="M12 47.5 C19 53 29 54 38 50"
          stroke="#8BC34A"
          strokeWidth="2.1"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
