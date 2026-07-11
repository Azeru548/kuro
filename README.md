# Kuro — Campus Help Marketplace

Students hire helpers for **tutoring, feedback, code review, and study support**.  
Clients set a price, bid on up to **3 helpers**, chat on-platform, and pay with **Paystack**.

> Positioning: learning help — not ghostwriting graded work.

## Stack

| Layer | Tech |
|---|---|
| App | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4, purple theme, Cormorant Garamond + Libre Baskerville |
| Auth / DB / files | Firebase Auth, Firestore, Storage |
| Payments | Paystack |
| Hosting | Netlify (`@netlify/plugin-nextjs`) |

## Product rules (implemented in UI)

- Any email (school or personal)
- Anyone can be a helper
- Client form → helper gallery with **Bid** / **Cancel bid**
- Max **3** active bids per request
- Helpers set a **minimum price**; bids below min are blocked
- Helper inbox: **Accept** or **Decline** with templates  
  (amount too small, unavailable, not my specialty, etc.)
- **First accept wins** — other pending bids expire
- Chat between client and helpers (opens on bid)

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo dashboards work **without** Firebase/Paystack keys:

- Client: `/client`
- Helper: `/helper`
- Auth UI: `/auth`

## Environment

Copy `.env.example` → `.env.local` and fill:

- `NEXT_PUBLIC_FIREBASE_*` — Firebase web config  
- `FIREBASE_ADMIN_*` — service account (server only)  
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY`  
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000` or your Netlify URL  

## Deploy (Netlify)

1. Connect the repo to Netlify  
2. Build command: `npm run build` (see `netlify.toml`)  
3. Add env vars in Netlify UI  
4. Ensure `@netlify/plugin-nextjs` is available (Netlify often injects it; or `npm i -D @netlify/plugin-nextjs`)  

## Project map

```
src/
  app/
    page.tsx                 # Landing
    auth/                    # Login / signup
    client/                  # Client dashboard
      requests/new           # Request form
      requests/[id]/helpers # Bid on helpers
      jobs/                  # Track + Paystack checkout
      history/
      messages/
    helper/                  # Helper dashboard
      inbox/                 # Accept / decline
      jobs/
      earnings/
      messages/
      profile/               # Min price, specialties
    admin/                   # Stub
    api/paystack/            # Initialize + verify
  components/
  lib/
    firebase/                # Client + Admin stubs
    paystack.ts
    types.ts
    mock-data.ts             # Demo data
```

## Next implementation steps

1. Wire Firebase Auth (email/password) to create `users/{uid}`  
2. Persist requests, bids, jobs, chats in Firestore  
3. Enforce bid max + min price in API routes (Admin SDK)  
4. Connect Paystack initialize → redirect → verify webhook/callback  
5. Firebase Storage for attachments/deliverables  
6. Harden Firestore rules and add admin dispute flow  

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
