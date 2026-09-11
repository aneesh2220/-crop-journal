import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope, Satellite, LineChart, Droplets, MessageSquare, Languages, Play,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'

/**
 * Public landing page, shown at `/` to anyone not signed in.
 *
 * Visual language follows the "Organic" design system used by AgroAI App v2: dark
 * green ground, sage accent, warm cream text, floating leaves and a sweeping glare on
 * the preview card.
 *
 * The design's copy was placeholder marketing fiction — invented yield figures,
 * six fake customer logos and a testimonial from a person who does not exist.
 * None of it is true of this app, so the layout is reproduced faithfully while
 * every claim on the page is one AgroAI can actually stand behind. The logo
 * marquee now lists the real upstream data sources, which is both honest and a
 * stronger credibility signal than invented customers.
 */

const FEATURES = [
  {
    icon: Stethoscope,
    title: 'Crop Doctor',
    body: 'Photograph an affected leaf and get the likely problem, its cause and how to treat it — in about 30 seconds.',
  },
  {
    icon: Satellite,
    title: 'Satellite field view',
    body: 'See your plot from above on a dated satellite pass, and track crop vigour week by week from the same imagery.',
  },
  {
    icon: LineChart,
    title: 'Mandi prices',
    body: "Today's commodity rates from government market data, with the minimum support price shown beside them.",
  },
  {
    icon: Droplets,
    title: 'Irrigation advisor',
    body: 'Watering guidance for your crop and its growth stage, plus practical ways to use less water for the same result.',
  },
  {
    icon: MessageSquare,
    title: 'AI farming assistant',
    body: 'Ask anything about your crop, soil, pests or season in plain language and get a practical answer.',
  },
  {
    icon: Languages,
    title: '23 Indian languages',
    body: 'Ask in Hindi, Marathi, Telugu, Tamil, Bengali or 18 more — and get the answer back in the same language.',
  },
]

const STEPS = [
  { n: '1', title: 'Open it — nothing to install', body: 'AgroAI runs in any phone browser. Start as a guest; no account needed to try the tools.' },
  { n: '2', title: 'Ask, or send a photo', body: 'Type your question in your own language, or photograph the crop. The answer comes back in the same language.' },
  { n: '3', title: 'Save your farm when ready', body: 'Create a free account to pin your field, track crops day by day and keep task reminders.' },
]

/** Real upstream sources. Replaces the design's invented customer logos. */
const SOURCES = [
  'COPERNICUS SENTINEL-2', 'AGMARKNET', 'OPENWEATHER', 'ESRI WORLD IMAGERY',
  'GOOGLE GEMINI', 'DATA.GOV.IN',
]

function Leaf({ className, size, opacity }: { className: string; size: number; opacity: number }) {
  return (
    <svg className={className} style={{ opacity }} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C7 6 5 10 5 14a7 7 0 0014 0c0-4-2-8-7-12z" fill="currentColor" />
    </svg>
  )
}

export default function Landing() {
  useEffect(() => {
    const prev = document.title
    document.title = 'AgroAI — Free AI Farming Assistant for Indian Farmers'
    return () => { document.title = prev }
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0e1a10] font-sans text-[#f2ecdc]">
      {/* NAV */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[#35482f]/12 bg-[#0e1a10]/75 px-5 py-5 backdrop-blur-md sm:px-8 lg:px-16">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark size={34} />
          <span className="font-display text-lg font-bold tracking-tight">AgroAI</span>
        </Link>

        <nav className="hidden gap-7 text-sm font-medium text-[#c8d3ba] md:flex">
          <a href="#features" className="transition-colors hover:text-[#ccdbb2]">Features</a>
          <a href="#how" className="transition-colors hover:text-[#ccdbb2]">How it works</a>
          <Link to="/about" className="transition-colors hover:text-[#ccdbb2]">About</Link>
        </nav>

        <div className="flex items-center gap-3.5">
          <Link to="/login" className="text-sm font-semibold text-[#f2ecdc] transition-colors hover:text-[#ccdbb2]">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-[#ccdbb2] px-5 py-2.5 text-sm font-bold text-[#16251a] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(204,219,178,.35)]"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pb-10 pt-14 sm:px-8 sm:pt-20 lg:px-16 lg:pt-28">
        <div
          className="pointer-events-none absolute inset-x-[-10%] top-[-10%] h-[520px] blur-[10px]"
          style={{
            background:
              'radial-gradient(60% 60% at 30% 20%, rgba(86,99,63,.45), transparent 70%), radial-gradient(50% 50% at 80% 10%, rgba(204,219,178,.18), transparent 70%)',
          }}
        />
        <Leaf className="absolute right-[6%] top-[12%] animate-float-1 text-[#ccdbb2]" size={52} opacity={0.5} />
        <Leaf className="absolute right-[18%] top-[38%] animate-float-2 text-[#aebf92]" size={30} opacity={0.35} />
        <Leaf className="absolute right-[32%] top-[8%] animate-float-3 text-[#ccdbb2]" size={22} opacity={0.3} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,1fr)]">
          <div className="animate-rise-in min-w-0">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ccdbb2]/30 bg-[#ccdbb2]/[.06] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#ccdbb2]">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-[#ccdbb2]" />
              Free for every Indian farmer
            </span>

            <h1 className="font-display text-[clamp(34px,4.6vw,58px)] font-bold leading-[1.06] tracking-[-.02em]">
              Grow smarter with<br />
              AI that reads your <span className="text-[#ccdbb2]">soil, sky &amp; crops</span>
            </h1>

            <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-[#c8d3ba]">
              AgroAI brings crop disease diagnosis, soil analysis, satellite field views, weather and
              mandi prices into one page — in your own language, on the phone you already own.
            </p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link
                to="/signup"
                className="rounded-full bg-[#ccdbb2] px-6 py-3.5 text-[15px] font-bold text-[#16251a] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(204,219,178,.35)]"
              >
                Start free
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-full border border-[#f2ecdc]/30 px-6 py-3.5 text-[15px] font-semibold transition-colors hover:border-[#ccdbb2] hover:bg-[#ccdbb2]/[.06]"
              >
                <Play size={14} fill="currentColor" />
                Try as guest
              </Link>
            </div>

            <dl className="mt-10 flex flex-wrap gap-9">
              {[
                { v: '13', l: 'farming tools' },
                { v: '23', l: 'languages' },
                { v: '₹0', l: 'to use, always' },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-display text-[26px] font-bold text-[#ccdbb2]">{s.v}</dt>
                  <dd className="text-[13px] text-[#8b9b80]">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Preview card — labelled Example, because a landing page cannot show live data */}
          <div className="animate-rise-in relative min-w-0">
            <div className="relative overflow-hidden rounded-[20px] border border-[#35482f]/15 bg-gradient-to-b from-[#1c2a1a] to-[#16251a] p-5 shadow-[0_30px_70px_rgba(0,0,0,.45)]">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute bottom-0 top-0 w-[60px] animate-sweep bg-gradient-to-r from-transparent via-[#ccdbb2]/[.08] to-transparent" />
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="text-[13px] font-bold">Your field — crop vigour</div>
                <div className="rounded-full bg-[#ccdbb2]/15 px-2.5 py-1 text-[11px] font-bold text-[#ccdbb2]">
                  EXAMPLE
                </div>
              </div>

              <svg viewBox="0 0 320 130" width="100%" height={130} className="mb-3.5 block" aria-hidden="true">
                <defs>
                  <linearGradient id="landing-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ccdbb2" stopOpacity=".5" />
                    <stop offset="100%" stopColor="#ccdbb2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline points="0,90 30,80 60,88 90,60 120,66 150,40 180,50 210,30 240,36 270,18 300,24 320,14" fill="none" stroke="#aebf92" strokeWidth="2" opacity=".5" />
                <polyline points="0,100 30,95 60,85 90,88 120,70 150,74 180,55 210,58 240,42 270,46 300,30 320,32" fill="none" stroke="#ccdbb2" strokeWidth="2.5" />
                <polygon points="0,100 30,95 60,85 90,88 120,70 150,74 180,55 210,58 240,42 270,46 300,30 320,32 320,130 0,130" fill="url(#landing-area)" />
              </svg>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Crop vigour', value: '0.49', pct: 49, color: '#ccdbb2', delay: '.3s' },
                  { label: 'Last pass', value: '2d ago', pct: 80, color: '#aebf92', delay: '.45s' },
                  { label: 'Status', value: 'Growing', pct: 60, color: '#f4e6a1', delay: '.6s' },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-[#f2ecdc]/5 p-3">
                    <div className="mb-1 text-[11px] text-[#8b9b80]">{m.label}</div>
                    <div className="text-[17px] font-bold">{m.value}</div>
                    <div className="mt-2 h-1 overflow-hidden rounded-sm bg-white/10">
                      <div
                        className="h-full origin-left animate-grow-bar rounded-sm"
                        style={{ width: `${m.pct}%`, background: m.color, animationDelay: m.delay }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DATA SOURCES MARQUEE */}
      <div className="overflow-hidden border-y border-[#35482f]/10 py-5">
        <p className="sr-only">Data sources</p>
        <div className="flex w-max animate-marquee gap-16 font-display text-[15px] font-semibold tracking-wide text-[#6e7d63]">
          {[...SOURCES, ...SOURCES].map((s, i) => (
            <span key={`${s}-${i}`} aria-hidden={i >= SOURCES.length}>{s}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="px-5 py-16 sm:px-8 sm:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-[600px]">
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[.06em] text-[#ccdbb2]">Platform</div>
            <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-bold leading-[1.15]">
              Everything a smallholder needs, in one place
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="rounded-[18px] border border-[#35482f]/12 bg-gradient-to-b from-[#16251a] to-[#121d15] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#ccdbb2]/40"
              >
                <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#ccdbb2]/12">
                  <f.icon size={20} className="text-[#ccdbb2]" />
                </div>
                <h3 className="mb-2 text-[17px] font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#a8b79b]">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how"
        className="px-5 py-10 sm:px-8 sm:py-16 lg:px-16 lg:py-20"
        style={{ background: 'linear-gradient(180deg,transparent,rgba(204,219,178,.04),transparent)' }}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 font-display text-[clamp(24px,3vw,32px)] font-bold">How AgroAI works</h2>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-[#ccdbb2] font-display font-bold text-[#ccdbb2]">
                  {s.n}
                </div>
                <h3 className="mb-1.5 text-base font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-[#a8b79b]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PULL QUOTE — a real proverb, in place of the design's invented testimonial */}
      <section className="px-5 py-12 sm:px-8 sm:py-20 lg:px-16">
        <blockquote className="mx-auto max-w-[760px] border-l-2 border-[#ccdbb2] pl-7">
          <p className="font-display text-[clamp(20px,2.6vw,26px)] font-medium leading-[1.45]">
            उत्तम खेती, मध्यम बान।
          </p>
          <p className="mt-3 text-[clamp(16px,2vw,19px)] leading-relaxed text-[#c8d3ba]">
            Farming is the finest work, trade comes second.
          </p>
          <footer className="mt-4 text-sm text-[#a8b79b]">— traditional Indian proverb</footer>
        </blockquote>
      </section>

      {/* CTA */}
      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-16 lg:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[24px] border border-[#35482f]/15 bg-gradient-to-br from-[#22331f] to-[#16251a] p-8 sm:p-12 lg:p-16">
          <div
            className="pointer-events-none absolute -top-2/5 right-[-10%] h-[180%] w-3/5 animate-pulse-glow"
            style={{ background: 'radial-gradient(circle,rgba(204,219,178,.25),transparent 70%)' }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-[520px]">
              <h2 className="mb-3 font-display text-[clamp(24px,3.2vw,34px)] font-bold">
                Ready to see your field differently?
              </h2>
              <p className="text-[15px] text-[#c8d3ba]">
                Free, no installation, and you can start as a guest without signing up.
              </p>
            </div>
            <Link
              to="/signup"
              className="whitespace-nowrap rounded-full bg-[#ccdbb2] px-7 py-4 text-[15px] font-bold text-[#16251a] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(204,219,178,.4)]"
            >
              Open AgroAI
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#35482f]/10 px-5 py-8 sm:px-8 lg:px-16">
        <div className="flex items-center gap-2">
          <BrandMark size={22} />
          <span className="font-display text-sm font-bold">AgroAI</span>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-[13px] text-[#7e8f72]">
          <Link to="/about" className="transition-colors hover:text-[#ccdbb2]">About</Link>
          <Link to="/login" className="transition-colors hover:text-[#ccdbb2]">Sign in</Link>
          <span>© {new Date().getFullYear()} AgroAI. Built for growers.</span>
        </div>
      </footer>
    </div>
  )
}
