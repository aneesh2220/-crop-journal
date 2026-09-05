# AgroAI — Smart Farming Assistant

An AI-powered agricultural web app for Indian farmers: crop diagnosis, soil analysis,
weather, mandi prices, farm management, and a multilingual AI assistant (text/image/voice)
in 23 languages (English + 22 scheduled Indian languages).

Stack: **React + Vite + TypeScript + Tailwind CSS v4**, **Supabase** (Postgres, Auth,
Storage, Edge Functions), **Anthropic Claude** for AI, **OpenWeatherMap** for weather,
**data.gov.in Agmarknet** for mandi prices.

No feature shows fabricated data — every screen that depends on an API key you haven't
configured yet shows an honest "not connected" state instead of fake numbers.

---

## 1. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account
- An [Anthropic Console](https://console.anthropic.com/settings/keys) API key (Claude) — note: Anthropic has no free tier, so this key is billed per request
- A free [OpenWeatherMap](https://openweathermap.org/api) API key
- (Optional) A free API key from [data.gov.in](https://data.gov.in) for mandi prices
- The [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase`) to deploy edge functions

## 2. Create your Supabase project

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql). This creates every
   table, Row Level Security policy (so each farmer can only ever see their own data), and storage bucket.
3. In **Authentication → Providers**, enable **Email**, **Phone** (needs an SMS provider like
   Twilio configured under Authentication → Providers → Phone), and **Google** (add your Google OAuth
   client ID/secret — see [Supabase's Google guide](https://supabase.com/docs/guides/auth/social-login/auth-google)).
4. In **Authentication → URL Configuration**, add your deployed site URL and
   `http://localhost:5173` as allowed redirect URLs.

## 3. Configure the frontend

Copy the example env file and fill in your project's URL and anon key (Project Settings → API):

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Never put the Claude/weather/market API keys here — they belong on the server (next step),
never in the frontend bundle.

## 4. Deploy the Edge Functions (secure backend)

The four functions in [`supabase/functions`](supabase/functions) are the *only* place the
Claude, OpenWeatherMap, and data.gov.in keys are ever used:

```bash
supabase login
supabase link --project-ref your-project-ref

supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
supabase secrets set OPENWEATHER_API_KEY=your-openweather-key
supabase secrets set DATA_GOV_IN_API_KEY=your-data-gov-in-key   # optional — Market Watch shows "not connected" without it

supabase functions deploy ai-assist
supabase functions deploy weather-proxy
supabase functions deploy market-proxy
supabase functions deploy delete-account
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided
automatically inside edge functions — you don't set those yourself.

## 5. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. Until steps 2–4 are done the app still runs — auth screens,
navigation, and every page render, but each data-dependent screen shows a clear
"not connected" placeholder instead of pretending to have live data.

## 6. Deploy

Any static host works since this is a Vite SPA. Vercel (`vercel.json` included) and
Netlify (`public/_redirects` included) both work out of the box:

```bash
npm run build   # outputs to dist/
```

- **Vercel**: `vercel --prod` (set the two `VITE_SUPABASE_*` env vars in the Vercel dashboard)
- **Netlify**: drag-and-drop `dist/`, or `netlify deploy --prod` (same env vars)

## Project structure

```
src/
  components/     Reusable UI (Button, Card, Modal, layout shell, language switcher…)
  contexts/       AuthContext (Supabase auth), ThemeContext (dark/light/system)
  hooks/          Data hooks — useFarms, useCrops, useTasks, useWeather, useVoice…
  i18n/           23 locale JSON files + language registry
  lib/            Supabase client, typed DB schema, Claude/weather/market API wrappers
  pages/          One file per route (Dashboard, ChatAssistant, CropDoctor, …)
  data/quotes.ts  Multilingual agricultural/motivational quotes
supabase/
  schema.sql               Full DB schema + RLS policies + storage buckets
  functions/ai-assist       Claude proxy (chat, crop doctor, soil health, crop suggestions, irrigation)
  functions/weather-proxy   OpenWeatherMap proxy
  functions/market-proxy    data.gov.in Agmarknet proxy
  functions/delete-account  Deletes the auth user (service-role, cascades all farm data)
```

## Notes on language coverage

All 23 languages share one JSON key structure (`src/i18n/locales/*.json`). English and Hindi
were hand-written; the remaining 21 were produced by a dedicated translation pass. Machine/AI
translation quality is generally strong for the major languages (Bengali, Gujarati, Kannada,
Malayalam, Marathi, Nepali, Odia, Punjabi, Tamil, Telugu, Urdu, Assamese) but lower-resource
languages — Bodo, Dogri, Konkani, Maithili, Manipuri, Santali, Sindhi, Kashmiri — should get a
native-speaker review pass before you rely on them in production. AI assistant replies (chat,
crop doctor, etc.) are generated live in the farmer's selected language by Claude, not from
these static files, so their quality depends on Claude rather than these translations.
