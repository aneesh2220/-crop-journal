# AgroAI — Smarter Farming. Better Tomorrow.

**A free, AI-powered farming assistant for Indian smallholder farmers.**

| | |
|---|---|
| **Live application** | https://agroai-five.vercel.app |
| **Source code** | https://github.com/aneesh2220/-crop-journal |
| **Author** | Aneesh |
| **Status** | Deployed and publicly usable |

---

## 1. The problem

Good agricultural guidance already exists in India. The problem is that it is scattered, and almost none of it is reachable by the people who need it most.

Disease identification lives on one website. Soil interpretation on another. Weather somewhere else. Mandi rates somewhere else again. Most of it is written in English, most of it assumes a desktop computer and a stable connection, and almost none of it answers a *specific* question about a *specific* field.

A farmer with two acres, a basic Android phone and a patchy 4G signal cannot realistically use any of it. When a crop starts failing, the practical options are to ask a neighbour, guess, or wait for an extension officer who may be days away. By then the loss is already in the ground.

## 2. The solution

AgroAI collapses that scattered guidance into a single page a farmer can open on the phone already in their pocket, ask a question in their own language, and get a usable answer from.

Three commitments shape every decision in the project:

- **Free.** No subscription, no payment, no trial that expires.
- **No installation.** It runs in any phone browser. Nothing to download on a device with no storage left.
- **Their language.** 23 Indian languages, with the AI answering in whichever language the question was asked in.

## 3. Features

### AI-powered tools

| Feature | What it does |
|---|---|
| **AI Farming Assistant** | Conversational Q&A on crops, soil, pests, fertiliser and seasons, streamed token-by-token so answers appear as they are written. |
| **Crop Doctor** | Photograph an affected leaf and describe the symptoms; returns the likely problem, its causes, treatment steps, prevention, a confidence figure and a severity rating. |
| **Soil Health Analyser** | Converts raw pH and N-P-K test values into a plain-language interpretation with correction suggestions and suitable crops. |
| **Crop Suggestions** | Ranks crops against the farmer's location, season, soil type and water availability. |
| **Irrigation Advisor** | Watering schedule for the crop's current growth stage, plus water-saving measures. |

### Live data tools

| Feature | What it does |
|---|---|
| **Satellite Field View** | Dated Sentinel-2 imagery of the farmer's own plot (a pass roughly every 5 days), with a cloud-masked NDVI crop-vigour reading and a multi-week trend. High-resolution Esri imagery serves as the sharp base layer. |
| **Weather** | Current conditions and a 5-day forecast for the farm's coordinates, with notes on what it means for field work. |
| **Market Watch** | Daily commodity prices from Indian government mandi data, shown alongside the Minimum Support Price so a farmer can judge whether an offered rate is fair. |

### Record-keeping

| Feature | What it does |
|---|---|
| **My Farm** | Farm profile with GPS-pinned plot location, land size, soil and irrigation type, and the crops growing on it. |
| **Farm Progress** | Five-stage crop timeline with a day counter from the sowing date, progress and health sliders. |
| **Crop Diary** | Day-by-day log of field work — irrigation, fertiliser, spraying, weeding, observations, problems, harvest and costs — with optional GPS proof and photographs. |
| **Farm Activity Record** | A printable, dated document summarising the diary, the plot's satellite imagery and how consistently the record was kept. Designed as documentation a farmer can present, for example when applying for credit. |
| **Tasks** | Field task list with due dates and reminders. |

## 4. Technical architecture

### Stack

**Frontend** — React 19, Vite 8, TypeScript 6, Tailwind CSS v4, React Router 7, react-i18next, Leaflet, Recharts.
**Backend** — Supabase: PostgreSQL with Row Level Security, Auth, Storage, and Deno Edge Functions.
**Hosting** — Vercel, with continuous deployment.

### Scale

| Metric | Count |
|---|---|
| Lines of application code | ~9,300 |
| Application routes | 21 |
| React components | 21 |
| Custom hooks | 8 |
| Database tables | 12 |
| Serverless edge functions | 5 |
| Supported languages | 23 |

### Design decisions worth explaining

**API keys never reach the browser.** Every third-party call — the AI provider, weather, market data — is proxied through a Supabase Edge Function. The browser only ever holds the Supabase anonymous key, which is designed to be public and is constrained by Row Level Security.

**A three-tier AI provider chain.** Requests try Claude, fall back to Google Gemini, then to Groq. Each tier fires only when the one above genuinely cannot serve — an invalid key, an exhausted quota, or an outage. The app degrades to a rougher answer instead of telling a farmer the assistant is down.

**Two independent spend ceilings.** A per-user daily cap (25 requests) stops one person draining the shared allowance; an application-wide cap (1,500/day) bounds total cost. Both are enforced in Postgres before any paid API call, so the worst-case spend is a calculable number rather than a hope.

**Guest mode via anonymous authentication.** A farmer can use the AI tools, satellite view and market prices without creating an account. Signing up is only required for features that persist personal farm data — which means the app proves its value before asking for anything.

**Row Level Security on every table.** Each row carries a `user_id`, and policies restrict access to the owner. Two internal tables carry RLS with *no* policies at all, making them reachable only by server-side functions holding the service-role key.

**NDVI is cloud-masked per pixel.** A satellite scene can be 30% cloudy overall with the one cloud sitting directly over the farm. Cloud reflects strongly in red light, which collapses the NDVI figure toward zero and would read as "your crop is dead". Every sample point is checked against Sentinel-2's scene-classification band and discarded if it is cloud or shadow; a fully clouded day reports *no reading* rather than a confident wrong one.

## 5. Data sources

All upstream data is free and openly licensed. No paid data subscriptions.

| Source | Used for |
|---|---|
| Copernicus Sentinel-2 (ESA), via Earth Search STAC | Dated field imagery and NDVI crop vigour |
| Esri World Imagery | High-resolution base map |
| Agmarknet / data.gov.in | Daily mandi commodity prices |
| OpenWeatherMap | Current conditions and forecast |
| Anthropic Claude, Google Gemini, Groq | AI reasoning and vision |

## 6. Accessibility and reach

- **23 Indian languages** — Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, Urdu, Sanskrit, Nepali, Maithili, Santali, Kashmiri, Konkani, Sindhi, Dogri, Manipuri, Bodo and English.
- **Mobile-first**, tested on a 375px viewport; the interface is built for one-handed use on a modest phone.
- **Light and dark themes**, following the device setting.
- **Reduced-motion support** for users who have asked their device to limit animation.
- **Plain language throughout** — written for a farmer with limited literacy, not for an agronomist.

## 7. Honesty as a design principle

Agricultural advice carries real financial consequence. A farmer may spray a chemical, change an irrigation schedule, or sell a harvest based on what this app says. Several features are therefore deliberately *less* impressive than they could be:

- The AI is instructed to say it does not know rather than invent a price or a forecast. Live figures come from real feeds, never from the model.
- Crop Doctor shows a severity rating derived from the model's own output, not fabricated per-disease percentages, and carries a standing instruction to confirm dosing with the local Krishi Vigyan Kendra before spraying.
- Satellite readings taken through cloud are reported as *no reading*, not as a number.
- The Farm Activity Record discloses how promptly each entry was written, so a reader can judge the record's reliability rather than take it on trust. It states plainly that it is not a credit score.

## 8. Current limitations

Stated honestly, because a project's known gaps matter as much as its features:

- **Satellite imagery is not live.** Sentinel-2 passes roughly every 5 days at 10 m per pixel; cloudy days give no reading. No consumer service offers live imagery of a field.
- **Notifications do not yet auto-generate.** The page and infrastructure exist, but nothing currently creates entries.
- **Phone login is present in the interface but non-functional**, as no SMS provider is configured.
- **Two of 23 languages are fully hand-checked** (English, Hindi). The rest are machine-translated and have not been reviewed by native speakers.
- **NDVI samples a ~20 m area around the pinned point**, not a drawn field boundary — a reasonable approximation on a one-acre holding, not a precise field average.
- **The AI can be wrong.** It is a starting point for thinking, not a replacement for an agronomist.

## 9. Future work

- Auto-generated notifications driven by task due dates, weather warnings and crop-stage changes
- Field boundary drawing, so NDVI covers the actual plot rather than a radius
- Native-speaker review of the remaining 21 translations
- Progressive Web App installation, and a Play Store release via a Trusted Web Activity
- Weather cross-checking of diary entries, strengthening the Farm Activity Record

## 10. Summary

AgroAI is a working, deployed application — not a prototype. It combines a modern React frontend, a secure serverless backend, multiple live data integrations and a resilient multi-provider AI pipeline into a tool a smallholder farmer can genuinely use: free, in their own language, on the phone they already own.

Its guiding principle is that a farmer acting on its advice is risking a real season's income — so where the app cannot be certain, it says so.
