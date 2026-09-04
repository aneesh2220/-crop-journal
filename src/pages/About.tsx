import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope,
  FlaskConical,
  Wheat,
  Droplets,
  CloudSun,
  LineChart,
  MessageSquare,
  ListChecks,
  Languages,
  ShieldCheck,
  Smartphone,
  ArrowRight,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'AI Farming Assistant',
    body: 'Ask anything about your crop, soil, pests, fertiliser or season in plain language and get a practical answer in seconds.',
  },
  {
    icon: Stethoscope,
    title: 'Crop Doctor',
    body: 'Upload a photo of an affected leaf or plant, describe the symptoms, and get AI-assisted guidance on the likely problem and how to treat it.',
  },
  {
    icon: FlaskConical,
    title: 'Soil Health Analyser',
    body: 'Enter your pH and N-P-K test values (or a photo of the soil) and get a readable interpretation with correction suggestions.',
  },
  {
    icon: Wheat,
    title: 'Crop Suggestions',
    body: 'Get crop recommendations matched to your location, season, land size and water availability.',
  },
  {
    icon: Droplets,
    title: 'Irrigation Advisor',
    body: 'Watering guidance based on your crop and its growth stage, along with practical water-saving tips.',
  },
  {
    icon: CloudSun,
    title: 'Weather',
    body: 'Current conditions and a 5-day forecast for your farm location, with notes on what it means for field work.',
  },
  {
    icon: LineChart,
    title: 'Market Watch',
    body: 'Daily commodity prices sourced from Indian mandi data, with minimum support price (MSP) shown alongside.',
  },
  {
    icon: ListChecks,
    title: 'My Farm, Progress & Tasks',
    body: 'Save your farm details, track crops through their growth stages, and keep a simple list of field tasks and reminders.',
  },
]

const STEPS = [
  {
    n: '1',
    title: 'Open it — no setup needed',
    body: 'AgroAI runs in any phone or desktop browser. There is nothing to install. You can try the AI tools straight away as a guest.',
  },
  {
    n: '2',
    title: 'Ask, or upload a photo',
    body: 'Type your question in your own language, or send a picture of the crop. The assistant answers in the same language you used.',
  },
  {
    n: '3',
    title: 'Create a free account to save your farm',
    body: 'Sign up only when you want your farm profile, crop progress and task reminders stored between visits.',
  },
]

const FAQS = [
  {
    q: 'What is AgroAI?',
    a: 'AgroAI is a free, AI-powered farming assistant built for Indian farmers. It brings crop health guidance, soil analysis, weather, irrigation advice, mandi market prices and simple farm record-keeping together in one web app that works on any phone.',
  },
  {
    q: 'Does AgroAI cost anything?',
    a: 'No. AgroAI is free to use. There is no subscription and no payment required.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No. You can continue as a guest and use the AI assistant, Crop Doctor, Soil Health, Crop Suggestions, Irrigation, Weather and Market Watch. An account is only needed to save your farm profile, track crop progress and keep task reminders.',
  },
  {
    q: 'Which languages does AgroAI support?',
    a: 'AgroAI works in 23 languages including Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, Urdu and English. The AI assistant replies in whichever language you write in.',
  },
  {
    q: 'Where do the market prices come from?',
    a: 'Prices come from Indian agricultural market (mandi) data published by the Government of India through Agmarknet, along with published minimum support prices. Prices are indicative and change daily — always confirm with your local mandi before selling.',
  },
  {
    q: 'Can AgroAI replace an agricultural expert?',
    a: 'No. AgroAI gives general, AI-generated guidance to help you think through a problem. For a serious disease outbreak, pesticide dosing, or a decision with real money attached, confirm with your local Krishi Vigyan Kendra or agricultural extension officer.',
  },
]

export default function About() {
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'About AgroAI — Free AI Farming Assistant for Indian Farmers'
    return () => {
      document.title = prevTitle
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-elevated)]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 font-bold text-[var(--text)]">
            <BrandMark size={30} />
            AgroAI
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button size="sm">Open the app</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(224,165,39,0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(74,156,96,0.28),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur">
            <BrandMark size={16} variant="bare" />
            AI-powered farming assistant
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            About AgroAI — your smart farming companion
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">
            AgroAI is a free web app that puts crop health guidance, soil analysis, weather,
            irrigation advice, mandi prices and farm record-keeping into one place — in 23 Indian
            languages, on any phone, with nothing to install.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login">
              <Button size="lg" variant="secondary" icon={<ArrowRight size={18} />}>
                Start using AgroAI
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Explore the tools
              </Button>
            </a>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { v: '13', l: 'farming tools' },
              { v: '23', l: 'languages' },
              { v: '₹0', l: 'to use' },
              { v: '0', l: 'apps to install' },
            ].map((s) => (
              <div key={s.l}>
                <dt className="text-3xl font-bold text-gold-300">{s.v}</dt>
                <dd className="mt-1 text-sm text-white/70">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">Why we built it</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <p className="text-base leading-relaxed text-[var(--text-muted)]">
            Good agricultural advice exists in India — it is just scattered. Disease identification
            sits in one place, soil interpretation in another, weather somewhere else, and mandi
            rates somewhere else again. Most of it is in English, most of it assumes a desktop, and
            almost none of it answers a specific question about a specific field.
          </p>
          <p className="text-base leading-relaxed text-[var(--text-muted)]">
            AgroAI collapses that into a single page a farmer can open on the phone already in their
            pocket, ask a question in their own language, and get a usable answer to. No fee, no
            installation, no form-filling before you are allowed to see anything useful.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">What AgroAI does</h2>
          <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
            Every tool works on its own — use the one you need today and ignore the rest.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition-shadow hover:shadow-md"
              >
                <div className="inline-flex rounded-xl bg-brand-100 p-2.5 dark:bg-brand-900/30">
                  <f.icon className="text-brand-600" size={20} />
                </div>
                <h3 className="mt-4 font-semibold text-[var(--text)]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">How to get started</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold text-[var(--text)]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">How AgroAI works with your data</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: Languages,
                title: 'Your language first',
                body: 'The interface and the AI both work in 23 languages. Write in Hindi, get an answer in Hindi.',
              },
              {
                icon: ShieldCheck,
                title: 'Your farm stays yours',
                body: 'Farm details, photos and chats are stored against your own account and are not visible to other users. Guests can use the AI tools without creating an account at all.',
              },
              {
                icon: Smartphone,
                title: 'Built for a phone on 4G',
                body: 'A lightweight web app, not a heavy install. It loads on modest phones and patchy connections.',
              },
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
                <p.icon className="text-brand-600" size={22} />
                <h3 className="mt-4 font-semibold text-[var(--text)]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-[var(--border)]">
          {FAQS.map((f) => (
            <div key={f.q} className="py-5">
              <h3 className="font-semibold text-[var(--text)]">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Honest limits — matters for trust, and for anyone acting on the advice */}
      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-6">
          <h2 className="font-semibold text-[var(--text)]">A note on AI advice</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            AgroAI's guidance is generated by an AI model and is meant as a starting point, not a
            prescription. It can be wrong. Before spraying a chemical, changing an irrigation
            schedule at scale, or selling a harvest on a quoted price, confirm with your local Krishi
            Vigyan Kendra, agricultural extension officer, or mandi.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)] bg-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:py-20">
          <h2 className="text-2xl font-bold sm:text-3xl">Try it on your farm today</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Free, no installation, and you can start as a guest without signing up.
          </p>
          <Link to="/login" className="mt-8 inline-block">
            <Button size="lg" variant="secondary" icon={<ArrowRight size={18} />}>
              Open AgroAI
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-[var(--text-muted)] sm:flex-row">
          <span className="flex items-center gap-2 font-semibold text-[var(--text)]">
            <BrandMark size={22} /> AgroAI
          </span>
          <span>Your smart farming companion — free for every Indian farmer.</span>
        </div>
      </footer>
    </div>
  )
}
