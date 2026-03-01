# SM's Investment Portfolio Tracker

A single-owner, publicly shareable investment portfolio tracker. The owner logs trades through a private authenticated dashboard. Anyone with the link sees the live portfolio, full trade history with reasoning, performance charts, and published think pieces — with no login required.

**Total infrastructure cost: $0/month**

---

## What's in this folder

```
/
├── index.html          ← Standalone HTML prototype (deploy this to see it live instantly)
├── portfolio-tracker/  ← Production Next.js 14 + Supabase app
├── SPEC.md             ← Full project specification
└── README.md           ← This file
```

---

## Option 1 — Deploy the prototype (`index.html`)

The prototype is a single, self-contained HTML file with zero dependencies. No build step, no npm, no server needed.

**Vercel (recommended)**
```bash
# Drag and drop index.html into vercel.com/new
# or:
npx vercel deploy index.html --prod
```

**Netlify**
```bash
# Drag and drop index.html into app.netlify.com/drop
```

**GitHub Pages**
```bash
git init && git add index.html && git commit -m "init"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
# Enable Pages in repo Settings → Pages → Deploy from branch: main / root
```

The prototype runs entirely in the browser with seeded mock data (5 years of deterministic price history). All charts, tables, and interactions work offline.

---

## Option 2 — Deploy the production app (`portfolio-tracker/`)

The full Next.js + Supabase app with real authentication, a live database, Finnhub quotes, and a rich-text editor.

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Supabase account](https://supabase.com) (free)
- [Finnhub API key](https://finnhub.io) (free — 60 req/min)
- [Vercel account](https://vercel.com) (free Hobby tier)

### Setup

```bash
# 1. Install dependencies
cd portfolio-tracker
npm install

# 2. Create your Supabase project at supabase.com
#    Then run the migration in the Supabase SQL editor:
#    supabase/migrations/001_initial_schema.sql

# 3. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in:
#   NEXT_PUBLIC_SUPABASE_URL=
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=
#   SUPABASE_SERVICE_ROLE_KEY=
#   FINNHUB_API_KEY=
#   NEXT_PUBLIC_SITE_URL=

# 4. Run locally
npm run dev
# → http://localhost:3000

# 5. Deploy to Vercel
npx vercel --prod
# or push to GitHub and connect the repo in vercel.com/new
```

### Environment variables (Vercel dashboard)

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret) |
| `FINNHUB_API_KEY` | finnhub.io → Dashboard |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel deployment URL |

---

## Feature overview

### Public pages (no login)

| Page | URL | What's shown |
|---|---|---|
| Portfolio | `/portfolio` | KPIs · 5-year chart vs 5 benchmarks · Holdings · Sector/country allocation · Sharpe ratios · Trade log with full reasoning · Investment journal · Published think pieces |
| Articles | `/articles` | Published think pieces listing |
| Article | `/articles/[slug]` | Full article |

### Private pages (owner only)

| Page | What it does |
|---|---|
| Dashboard | Portfolio overview with time machine, interactive benchmark chart (1M–All periods, 90d–730d rolling Sharpe), holdings, allocations |
| Log Trade | BUY/SELL form with live Finnhub quote fetch |
| Journal | Full investment journal with conviction, sentiment, tags |
| History | Complete trade log with CSV export |
| Analytics | Sharpe ratios (6M/1Y pre-computed + custom calculator), return by stock, monthly P&L |
| Global Indexes | 110+ ETFs across 11 categories with search |
| Watchlist | Ticker watchlist with price alerts |
| Think Pieces | Rich-text editor (TipTap), draft/publish workflow |
| Snapshots | Point-in-time portfolio snapshots with share links |
| Settings | Public URL, API key config, portfolio settings |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Rich text | TipTap |
| Quotes | Finnhub free API |
| Hosting | Vercel Hobby ($0) |

---

## Roadmap

- Daily snapshot automation via Supabase Edge Function (cron)
- Dividend tracking and calendar
- Earnings date alerts
- CSV import from brokerage export formats
- Options tracking (calls/puts)
- Multi-currency FX conversion
- Monte Carlo portfolio projections
- Tax lot tracking (FIFO/LIFO)
- PWA with offline support
- AI-assisted journal thesis suggestions
