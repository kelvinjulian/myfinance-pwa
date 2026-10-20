# MyFinance PWA — Phase 0: iPhone Spike

Offline-first personal finance PWA for iPhone built with Vite, React, TypeScript, Tailwind CSS, Dexie, `vite-plugin-pwa`, and Supabase.

This repository is currently at **Phase 0 (iPhone Spike)** to validate standalone PWA execution, persistent storage on iOS WebKit, IndexedDB stability, and Supabase authentication on iPhone.

> **Status on iOS:** UNVERIFIED ON iPHONE (Awaiting deployment to Vercel Preview and physical iPhone testing).

---

## 1. How to Run Locally

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Run tests:
```bash
npm test
# or: npx vitest run
```

Run linter:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

---

## 2. Environment Variables

Create `.env.local` (never committed to git) based on `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### For Vercel Deployment:
Configure these environment variables in your Vercel Project Settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

> **Important:** Ensure these variables are enabled for **Production**, **Preview**, and **Development** environments so that pull request / preview URLs have access to Supabase auth testing.

---

## 3. How to Deploy to Vercel

1. Push this repository to a private GitHub/GitLab repository.
2. Import the project in [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Set the Environment Variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) for all environments (Production & Preview).
5. Deploy. Vercel uses `vercel.json` to handle SPA route rewrites to `/index.html`.

---

## 4. Supabase Configuration

### OAuth & Redirect URLs
Register the Spike callback URL in your Supabase Dashboard:
- Go to: **Authentication** -> **URL Configuration** -> **Redirect URLs**.
- Add your Vercel domain(s):
  - `https://<your-vercel-domain>.vercel.app/spike`
  - `https://<your-preview-deployment>.vercel.app/spike` (or use wildcard `https://*-<team-name>.vercel.app/**` if allowed)
  - `http://localhost:5173/spike` (for local testing)
- In Google Cloud Console (OAuth Client), ensure the Supabase auth callback URL is registered.

### Email OTP Template
When using Supabase email OTP (One-Time Password):
- In Supabase Dashboard, navigate to **Authentication** -> **Email Templates** -> **Magic Link / OTP**.
- Make sure the template contains `{{ .Token }}` so the user receives the 6-digit numeric token rather than only a magic link.

---

## 5. Testing on iPhone

1. Open `https://<your-vercel-domain>/spike` in Safari on iPhone.
2. Tap the **Share** button -> **Add to Home Screen**.
3. Open the installed app from the Home Screen.
4. Verify the Spike parameters:
   - `standalone`: should be `true`
   - `dariShortcut`: shows `from` query parameter if launched via shortcut
   - `secureContext`: should be `true`
   - `randomUUID`: should be `ada`
   - `online`: `true` (and `false` in Airplane mode)
   - IndexedDB counters: `firstSeen` and `jumlahBuka` persist across app restarts and over time (1 day, 3 days, 7 days).
   - Storage persist request and quota estimate.
   - Supabase login (Google OAuth and Email OTP).
