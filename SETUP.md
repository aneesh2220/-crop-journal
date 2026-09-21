# Setting up AgroAI for development

For a second developer joining the project. About ten minutes start to finish.

> **A note first:** Claude Code has no concept of a shared project. A session is just
> Claude pointed at a folder on one machine, so nothing appears in another person's
> account. Each developer clones this repo, opens their own copy, and uses their own
> Claude account. Don't share a login — accounts are per-person.

---

## 1. Install the prerequisites

- **Node.js 20 or newer** — https://nodejs.org
- **Git** — https://git-scm.com

Check both:

```bash
node --version
git --version
```

## 2. Clone the repo

```bash
git clone https://github.com/aneesh2220/-crop-journal.git agroai
cd agroai
npm install
```

## 3. Add the environment file

The repo deliberately excludes `.env` — secrets never go into git. Create one in the
project root:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Ask Aneesh for those two values. **These two are safe to share** — the anon key is
designed to be visible in browsers and is constrained by row-level security.

**No other keys are needed to run the app.** The Claude, Gemini, OpenWeather and
data.gov.in keys live server-side as Supabase secrets and are never sent to the
browser. See `.env.example` for the full list and where each one belongs.

## 4. Run it

```bash
npm run dev
```

Open the URL it prints. The dev server honours a `PORT` environment variable, so two
people (or two projects) can run side by side without colliding.

## 5. Useful commands

```bash
npm run dev      # dev server with hot reload
npm run build    # type-check and production build — run before pushing
npm run lint     # oxlint
```

---

## Which database am I using?

Using Aneesh's Supabase URL means you are working against the **live database and
live users**. That is fine for reading and light testing. It is not fine for schema
changes or deleting rows.

If you will be doing real development, create your own free Supabase project instead:

1. Sign up at https://supabase.com and create a project.
2. In the SQL Editor, run the whole of `supabase/schema.sql`.
3. Put *your* project's URL and anon key in `.env`.

You then get an identical database with your own data, and cannot break anything of
Aneesh's. The AI features will show "AI backend is not connected yet" until the
server-side secrets are set on your project — everything else works.

## Project layout

```
src/
  pages/        One file per route (Landing, CropDoctor, FieldView, …)
  components/   Shared UI; components/ui/ holds Button, Card, Input, Modal
  hooks/        Data hooks (useFarms, useCrops, useCropLogs, …)
  lib/          Supabase client, typed DB schema, AI and API wrappers
  i18n/         23 language files; en.json and hi.json are the hand-checked ones
supabase/
  schema.sql    Full database schema — safe to re-run, it is idempotent
  migrations/   Incremental changes; apply with `npx supabase db push`
  functions/    Deno edge functions (ai-assist, field-insights, weather-proxy, …)
brand/          Logo exports and social assets
```

`PROJECT-DESCRIPTION.md` covers the architecture and the reasoning behind it.

## Working agreements

- **Never commit `.env`.** `.gitignore` covers it, so you would have to force it.
- **Branch before you work.** `git switch -c my-change`, then open a pull request.
- **Run `npm run build` before pushing.** It type-checks; CI will not catch it for you.
- **Avoid `/` in branch names.** The repo lives in a OneDrive folder, and nested git
  refs fail to write there. Use `my-change`, not `feature/my-change`.
