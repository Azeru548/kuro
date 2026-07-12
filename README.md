# Kuro — Campus Help Marketplace

Kuro is a web marketplace where students hire helpers for **tutoring, feedback, code review, walkthroughs, and study collaboration**. Clients set a budget, bid on up to three helpers, chat on-platform, track progress, and pay with **Paystack**.

> **Positioning:** learning support — not ghostwriting graded work for submission. Academic integrity is part of the product copy and request flow.

**Live repo:** [https://github.com/org-cyber/kuro](https://github.com/org-cyber/kuro)

---

## Table of contents

1. [Product overview](#product-overview)
2. [User roles & flows](#user-roles--flows)
3. [Product rules](#product-rules)
4. [Tech stack](#tech-stack)
5. [Design system](#design-system)
6. [Getting started](#getting-started)
7. [Environment variables](#environment-variables)
8. [Scripts](#scripts)
9. [Project structure](#project-structure)
10. [Routes](#routes)
11. [Data model (planned)](#data-model-planned)
12. [Payments (Paystack)](#payments-paystack)
13. [Firebase](#firebase)
14. [Deploy (Netlify)](#deploy-netlify)
15. [Current status](#current-status)
16. [Roadmap](#roadmap)
17. [Contributing / local tips](#contributing--local-tips)

---

## Product overview

| Piece | Description |
|---|---|
| Landing page | Value prop, how it works, helper pitch, integrity statement |
| Client dashboard | Create requests, bid on helpers, jobs, history, messages, checkout |
| Helper dashboard | Inbox (accept/decline), projects, earnings, messages, profile (min price) |
| Admin | Thin stub for disputes/moderation (not built out yet) |

**Matching model (client-initiated offers):**

1. Client fills a request form (details + price willing to pay).
2. Opens a helper gallery.
3. Bids on up to **3** helpers (Bid / Cancel bid per card).
4. Each helper has a **minimum price**; bids below that are blocked.
5. Helpers see offers in their **inbox** and Accept or Decline (with reason templates).
6. **First accept wins** — other pending bids on that request expire.
7. Chat opens when a client bids; continues through the job.
8. Client pays via **Paystack** on the matched job.

---

## User roles & flows

### Client (student hiring help)

```
Sign up / log in (any email)
  → New request form (title, description, category, deadline, price, integrity checkbox)
  → Choose helpers page (bid max 3, cancel frees a slot)
  → Messages with bidded helpers
  → On accept → Job + progress tracker + Paystack checkout
  → History of past jobs
```

### Helper (anyone)

```
Sign up / log in (any email)
  → Profile: bio, specialties, minimum price, availability
  → Inbox: pending bids with Accept / Decline templates
  → Active projects: status updates, deliverables (storage TBD)
  → Messages with clients
  → Earnings ledger
```

### Auth rules (product)

- **Any email** is allowed (school or personal Gmail/Yahoo/etc.).
- **Anyone** can be a helper (not restricted to students or upper-years).
- Users may act as client, helper, or both (UI supports switching dashboards in demo).

---

## Product rules

| Rule | Behavior in scaffold |
|---|---|
| Max 3 bids per request | Enforced in UI (`src/lib/bids.ts` + helper gallery) |
| Cancel bid | Frees a slot so client can bid on someone else |
| Helper minimum price | Bid blocked if offer &lt; min; shown on card |
| Decline templates | Amount too small, unavailable, not my specialty, deadline too tight, workload full, other |
| First accept wins | Accepting expires other pending bids on same request |
| On-platform chat | Client ↔ helper threads; soft warning if contact/payment off-platform patterns appear |
| Integrity pledge | Checkbox on request form + landing section |

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS 4** + small custom UI primitives |
| Auth | **Firebase Authentication** (stubbed; demo works without keys) |
| Database | **Cloud Firestore** (rules scaffolded; data is mock for now) |
| Files | **Firebase Storage** (rules scaffolded; uploads not wired) |
| Payments | **Paystack** (`/api/paystack/initialize`, `/api/paystack/verify`) |
| Hosting | **Netlify** (`netlify.toml` + Next.js plugin) |
| Validation | **Zod** (API payloads) |
| Icons | **lucide-react** |

### Why this stack

- Firebase fits realtime chat/status and school-friendly auth without running your own backend DB.
- Paystack is a natural fit for NGN / regional checkout.
- Netlify hosts the Next app; sensitive ops (Paystack secret, Admin SDK) stay in API routes.

---

## Design system

| Token | Value |
|---|---|
| Primary color | Purple scale (`purple-700` actions, soft purple backgrounds) |
| Display font | **Cormorant Garamond** — classical / elegant headings |
| Body font | **Libre Baskerville** — readable, slightly literary body text |
| UI feel | Rounded cards, soft purple borders, light lavender page background (`#faf7ff` / `#f7f3fc`) |

Fonts are loaded in `src/app/layout.tsx` via `next/font/google`.  
Global theme tokens live in `src/app/globals.css`.

---

## Getting started

### Requirements

- **Node.js 20+** recommended  
- npm (this project uses npm)

### Install & run

```bash
# clone
git clone https://github.com/org-cyber/kuro.git
cd kuro

# install
npm install

# env (optional for demo UI)
cp .env.example .env.local

# dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo without keys

You can explore the full UI **without** Firebase or Paystack configured:

| Area | URL |
|---|---|
| Landing | `/` |
| Auth UI | `/auth` |
| Client dashboard | `/client` |
| New request → helpers | `/client/requests/new` → helper gallery |
| Helper dashboard | `/helper` |
| Helper inbox | `/helper/inbox` |
| Admin stub | `/admin` |

Auth form will prompt you to use demo dashboards if Firebase env vars are missing.  
Paystack checkout on a job will return a friendly “not configured” message until keys are set.

### Windows note

On this machine, native Turbopack SWC bindings were unreliable. Scripts use **webpack**:

```json
"dev": "next dev --webpack",
"build": "next build --webpack"
```

If Turbopack works on your setup, you can drop `--webpack` later.

---

## Environment variables

Copy `.env.example` → `.env.local`:

```bash
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server only — never expose to the browser)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Kuro
```

| Variable group | Used for |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Client SDK init (`src/lib/firebase/client.ts`) |
| `FIREBASE_ADMIN_*` | Server Admin SDK (`src/lib/firebase/admin.ts`) |
| `PAYSTACK_*` | Initialize / verify transactions |
| `NEXT_PUBLIC_APP_URL` | Paystack callback base URL |

**Never commit** `.env.local` or service account JSON. They are gitignored.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local development (webpack) |
| `npm run build` | Production build (webpack) |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

---

## Project structure

```
kuro/
├── netlify.toml                 # Netlify build + Next plugin
├── firestore.rules              # Initial Firestore security rules
├── storage.rules                # Initial Storage security rules
├── .env.example                 # Env template
├── package.json
├── public/                      # Static assets
└── src/
    ├── app/
    │   ├── page.tsx             # Landing
    │   ├── layout.tsx           # Root layout + fonts
    │   ├── globals.css          # Theme
    │   ├── auth/                # Login / signup
    │   ├── client/              # Client dashboard routes
    │   │   ├── page.tsx         # Overview
    │   │   ├── requests/new     # Request form
    │   │   ├── requests/[id]/helpers  # Bid on helpers
    │   │   ├── jobs/            # Job list + detail (Paystack)
    │   │   ├── history/
    │   │   └── messages/
    │   ├── helper/              # Helper dashboard routes
    │   │   ├── page.tsx
    │   │   ├── inbox/           # Accept / decline
    │   │   ├── jobs/
    │   │   ├── earnings/
    │   │   ├── messages/
    │   │   └── profile/         # Min price, specialties
    │   ├── admin/               # Moderation stub
    │   └── api/paystack/
    │       ├── initialize/      # POST start transaction
    │       └── verify/          # GET verify reference
    ├── components/
    │   ├── ui/                  # Button, Card, Input, Badge, Textarea
    │   ├── site-header.tsx
    │   ├── dashboard-shell.tsx
    │   ├── helper-card.tsx
    │   ├── chat-panel.tsx
    │   └── status-badge.tsx
    └── lib/
        ├── types.ts             # Shared domain types + decline labels
        ├── mock-data.ts         # Demo users, helpers, bids, jobs, chats
        ├── bids.ts              # Max-3 / min-price eligibility helpers
        ├── utils.ts             # cn, currency, dates
        ├── paystack.ts          # Server Paystack helpers
        └── firebase/
            ├── client.ts
            └── admin.ts
```

---

## Routes

### Public

| Path | Description |
|---|---|
| `/` | Landing |
| `/auth` | Login / signup UI |

### Client

| Path | Description |
|---|---|
| `/client` | Overview |
| `/client/requests/new` | Create request |
| `/client/requests/[id]/helpers` | Helper gallery + bid/cancel |
| `/client/jobs` | Active jobs |
| `/client/jobs/[id]` | Progress + Paystack checkout |
| `/client/history` | Past / current sessions |
| `/client/messages` | Chats |

### Helper

| Path | Description |
|---|---|
| `/helper` | Overview |
| `/helper/inbox` | Incoming bids |
| `/helper/jobs` | Projects list |
| `/helper/jobs/[id]` | Manage status / deliverables placeholder |
| `/helper/earnings` | Simple ledger |
| `/helper/messages` | Chats |
| `/helper/profile` | Min price, specialties, availability |

### API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/paystack/initialize` | Start Paystack transaction (`email`, `amount`, `jobId`) |
| `GET` | `/api/paystack/verify?reference=` | Verify payment status |

### Admin

| Path | Description |
|---|---|
| `/admin` | Placeholder metrics + empty queue |

---

## Data model (planned)

Scaffold types live in `src/lib/types.ts`. Firestore collections intended:

```
users/{uid}
helperProfiles/{uid}
requests/{requestId}
bids/{bidId}                 # or subcollection under requests
jobs/{jobId}
chats/{chatId}/messages/{id}
payments/{paymentId}
reviews/{reviewId}
disputes/{disputeId}
```

### Status machines

**Request:**  
`open → matched → in_progress → delivered → completed` (+ `cancelled`)

**Bid:**  
`pending → accepted | declined | cancelled | expired`

**Job:**  
`assigned → in_progress → delivered → completed` (+ `disputed`, `cancelled`)

**Payment:**  
`pending → paid → released` (+ `refunded`, `failed`)

Bid eligibility helpers: `src/lib/bids.ts`  
Demo seed data: `src/lib/mock-data.ts`

---

## Payments (Paystack)

1. Client opens `/client/jobs/[id]` and clicks **Pay with Paystack**.
2. Browser `POST`s to `/api/paystack/initialize` with email, amount (NGN), jobId.
3. Server uses `PAYSTACK_SECRET_KEY` to create a transaction and returns `authorization_url`.
4. Client is redirected to Paystack Checkout.
5. On return, `/api/paystack/verify?reference=` confirms success (wire job `paymentStatus` in Firestore next).

Helpers:

- `src/lib/paystack.ts` — `initializeTransaction`, `verifyTransaction`, `toKobo`
- Amounts in the UI are **NGN**; Paystack API expects **kobo** (`naira * 100`)

Without keys, the API responds `503` with `{ demo: true }` and the UI explains configuration.

---

## Firebase

### Client (`src/lib/firebase/client.ts`)

- Lazy-inits Auth, Firestore, Storage when `NEXT_PUBLIC_FIREBASE_*` are set.
- `isFirebaseConfigured()` gates real auth vs demo messaging.

### Admin (`src/lib/firebase/admin.ts`)

- Server-only; uses service account env vars.
- Intended for privileged writes: bid accept, payment status, role changes.

### Security rules

- `firestore.rules` — basic ownership patterns; bid/job money transitions should prefer Admin SDK.
- `storage.rules` — request/job file paths, 15MB cap sketch.

Deploy rules from the Firebase console or CLI when the project is created.

---

## Deploy (Netlify)

1. Import [https://github.com/org-cyber/kuro](https://github.com/org-cyber/kuro) in Netlify.
2. Build settings are in `netlify.toml`:
   - Build command: `npm run build`
   - Publish: `.next`
   - Plugin: `@netlify/plugin-nextjs`
3. Set the same env vars as `.env.example` in Netlify → Site settings → Environment variables.
4. Set `NEXT_PUBLIC_APP_URL` to your Netlify site URL for Paystack callbacks.
5. Deploy.

Optional: `npm i -D @netlify/plugin-nextjs` if the build needs the plugin as a local dependency.

---

## Current status

### Done (scaffold)

- [x] Next.js app with purple classical branding  
- [x] Landing page + integrity messaging  
- [x] Auth UI (any email; Firebase ready when configured)  
- [x] Client dashboard: request form, helper bidding (max 3), jobs, history, messages  
- [x] Helper dashboard: inbox accept/decline templates, projects, earnings, profile, messages  
- [x] Chat UI with soft off-platform contact warning  
- [x] Paystack initialize/verify API routes  
- [x] Firebase client/admin stubs + Firestore/Storage rules drafts  
- [x] Netlify config  
- [x] Mock data so the product is clickable without backend keys  
- [x] Production build verified (`next build --webpack`)  
- [x] GitHub repository created and pushed  

### Not done yet (backend integration)

- [ ] Real Firebase Auth session + protected routes  
- [ ] Persist requests / bids / jobs / chats in Firestore  
- [ ] Server-enforced bid limits and accept race conditions  
- [ ] Paystack webhook + mark job paid in DB  
- [ ] File uploads (request attachments, deliverables)  
- [ ] Reviews / ratings write path  
- [ ] Full admin disputes  
- [ ] Email notifications  

---

## Roadmap

1. **Auth** — email/password (or magic link) → `users/{uid}` with role  
2. **Requests & bids** — write to Firestore; enforce max 3 + min price on server  
3. **Accept flow** — first accept creates `job`, expires sibling bids, opens job workspace  
4. **Chat** — Firestore messages + `onSnapshot` realtime  
5. **Paystack** — full callback/webhook → `paymentStatus: paid`  
6. **Storage** — attachments on requests and job deliverables  
7. **Admin** — dispute queue, ban, report  
8. **Polish** — filters on helper gallery, ratings, notifications (email)  

---

## Contributing / local tips

- Prefer small PRs aligned to the roadmap (auth → bids → jobs → pay).  
- Keep money-related status changes in **API routes / Admin SDK**, not open client Firestore writes.  
- Currency display uses NGN via `formatCurrency` in `src/lib/utils.ts`.  
- Decline reason labels are centralized in `DECLINE_REASON_LABELS` (`src/lib/types.ts`).  
- Dual-role users: demo nav includes “Switch to client/helper”; real auth should store `role: client | helper | both`.  

### Useful files to read first

1. `src/lib/types.ts` — domain language  
2. `src/lib/bids.ts` — matching rules  
3. `src/app/client/requests/[id]/helpers/page.tsx` — bid UX  
4. `src/app/helper/inbox/page.tsx` — accept/decline UX  
5. `src/lib/paystack.ts` + `src/app/api/paystack/*` — payments  

---

## License

Private / unlicensed unless you add a license file. Update this section if you open-source under MIT or similar.

---

## Summary

Kuro is a **campus help marketplace scaffold**: beautiful dual dashboards, the full bid → accept → chat → pay UX story, Firebase + Paystack + Netlify plumbing, and mock data for demos. Backend persistence and live payments are the next layer on top of this foundation.
