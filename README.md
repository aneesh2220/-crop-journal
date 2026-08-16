# Crop Journal (simple version)

Same app, no build step. Plain HTML/CSS/JS in `public/index.html`, served
directly by a small Express server (`server.js`) that also proxies photo
analysis to Google's free Gemini API.

## Run it locally

```bash
npm install
cp .env.example .env
```
Paste your Gemini key (from aistudio.google.com/apikey) into `.env`, then:
```bash
npm start
```
Open http://localhost:3001.

## Deploy on Render (to get a link to share)

1. Push this folder to a GitHub repo (same as before — replace the old
   repo's contents with these files instead).
2. On Render: New + → Web Service → select the repo.
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. Add environment variable `GEMINI_API_KEY` with your key.
6. Create Web Service, wait for "Live," open the URL.

No `vite build` step, no `dist` folder — this is what makes it reliable
for a quick share link.
