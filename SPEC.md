# Investment Portfolio Tracker — Project Specification (v3)

## Overview

A single-owner, publicly shareable portfolio tracker. The owner logs notional (paper) trades through a private authenticated dashboard. Anyone with the link can view the live portfolio, full trade history with reasoning, and performance vs global benchmarks. Think-piece articles can be published for the world to read.

**Total cost: $0/month**

---

## Architecture

```
┌──────────────────────────────────────────────┐
│          Next.js 14 (App Router)             │
│  Server Components · API Routes · Middleware │
│  Tailwind CSS · Recharts · TipTap           │
└──────────────┬───────────────────────────────┘
               │  Supabase SDK / REST
               ▼
┌──────────────────────────────────────────────┐
│             Supabase (free tier)             │
│  PostgreSQL · Auth · RLS · Storage          │
└──────────────┬───────────────────────────────┘
               │  REST
               ▼
┌──────────────────────────────────────────────┐
│      Finnhub API (free tier, 60 req/min)    │
│  Stock quotes · Historical candles          │
└──────────────────────────────────────────────┘

Hosting: Vercel (free Hobby tier)
Auth:    Supabase email/password
Storage: Supabase Storage (think-piece images)
```

### Stack decisions

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Server components, API routes, middleware auth — all in one |
| Database | Supabase PostgreSQL | Free tier, RLS, real-time, Auth built-in |
| Styling | Tailwind CSS | Utility-first, brand colour system |
| Charts | Recharts | React-native, lightweight, composable |
| Rich-text | TipTap | Extensible, image uploads, offline output |
| Quotes | Finnhub free tier | 60 calls/min, stock candles, 15-min delayed |
| Hosting | Vercel Hobby | $0, global CDN, instant Git deploys |

---

## Cost Breakdown

| Item | Monthly Cost |
|---|---|
| Vercel Hobby | $0 |
| Supabase free tier | $0 |
| Finnhub free API | $0 |
| Custom domain (optional) | ~$1/mo |
| **Total** | **$0** |

---

## Access Model

| Route | Who can access |
|---|---|
| `/` | Public — landing page |
| `/portfolio` | Public — live portfolio, holdings, trades + reasoning |
| `/articles` | Public — published think pieces |
| `/articles/[slug]` | Public — article detail |
| `/login`, `/signup` | Public |
| `/dashboard/*` | **Owner only** — protected by Supabase auth + Next.js middleware |

The `/portfolio` page is always live and refreshes every 60 seconds. There is no "make private" toggle — it is intentionally public to demonstrate transparent investing.

---

## Features

### Public: Live Portfolio (`/portfolio`)

- **KPI cards**: total value, total return (% and $), cash remaining, positions count, win rate
- **Performance chart** (interactive): portfolio % return vs S&P 500, NASDAQ 100, FTSE 100, MSCI World —  5 years of history with period selector (1M / 3M / 6M / YTD / 1Y / 3Y / 5Y / All / Custom), rolling Sharpe window selector (90d / 180d / 365d / 730d), crosshair hover tooltip with return + Sharpe for all series
- **Portfolio Time Machine**: select any historical date to see the portfolio's holdings and allocations as they were at that point
- **Holdings table**: ticker, name, shares, avg cost, live price, market value, return %, sector, position weight bar
- **Sector allocation**: horizontal bar chart
- **Country allocation**: horizontal bar chart
- **Risk & performance metrics**: win rate, avg hold period, best trade, max drawdown, annualised vol, beta
- **Sharpe Ratios table**: 6M and 1Y Sharpe vs all 5 benchmarks, with annualised return, vol, and Sharpe alpha vs portfolio
- **Full trade log with reasoning**: every trade with date, ticker, BUY/SELL badge, shares, price, total, thesis, sentiment
- **Investment journal**: full conviction-rated entries with tags, sentiment, linked trades — read-only
- **Published think pieces only**: drafts are private, published articles shown with excerpt

### Public: Think Pieces (`/articles`)

- Blog listing of all published articles with featured image, excerpt, date
- Full article view with rich HTML content (headings, images, blockquotes, code blocks)

### Private: Dashboard (`/dashboard`)

Full-featured owner dashboard with 11 pages:

1. **Dashboard** — Portfolio value, cash, positions, benchmark comparison chart (interactive, 5Y data, 5 benchmarks, crosshair, period/Sharpe controls, series toggles), holdings table, sector allocation, country allocation, Sharpe at-a-Glance card, Portfolio Time Machine
2. **Log Trade** — BUY/SELL form with live Finnhub quote fetch, shares/price, journal note (thesis, sentiment 1–5 stars conviction, tags)
3. **Journal** — Timeline of all journal entries, edit/delete, sentiment + conviction filter, linked trades
4. **History** — Full trade log table, BUY/SELL filter, CSV export, journal link badges
5. **Analytics** — Portfolio KPIs (win rate, avg hold, best/worst trade, max drawdown), 6M & 1Y Sharpe table for all 5 benchmarks, Sharpe Ratio Calculator (custom date range, adjustable risk-free rate, all-series results), per-stock return bar chart, monthly P&L bar chart
6. **Global Indexes** — 110+ ETFs across 11 categories (USA, UK, Europe, Japan/TOPIX, China, EM, Sectors, Thematic, Fixed Income, Money Market, MSCI Global) with live search/filter
7. **Watchlist** — Add tickers, live prices, price alerts (above/below threshold)
8. **Think Pieces** — Draft/published/archived workflow, TipTap rich text editor, image upload
9. **Snapshots** — Create point-in-time portfolio snapshots with permanent share links
10. **Public View Preview** — See exactly what the public sees; all content mirrored read-only including the interactive chart, time machine, and Sharpe tables
11. **Settings** — Public portfolio URL, API key config, public page toggles (holdings, trade history, benchmarks, think pieces, Sharpe, exact value), portfolio metadata

---

## Database Schema

```
portfolio_meta       — starting_cash, current_cash, last_updated
holdings              — ticker, shares, avg_cost
trades                — ticker, action, shares, price, total, cash_after, timestamp, journal_id
journal               — ticker, thesis, sentiment (BULLISH/NEUTRAL/BEARISH), conviction (1-10),
                       outcome_notes, lessons_learned, status, tags[], created_at
watchlist            — ticker, added_at
alerts               — ticker, condition (above/below), target_price, active, triggered_at
snapshots            — snapshot_token, title, description, holdings_data, trades_data,
                       journal_data, portfolio_value, cash_balance, is_public
think_pieces         — title, slug, content (HTML), excerpt, featured_image_url,
                       status (draft/published/archived), published_at
benchmark_data       — ticker (SPY/QQQ/EWU/ACWI), date, price
```

All tables use Row-Level Security. Private tables: `user_id = auth.uid()`. Public read: snapshots where `is_public=true`, think_pieces where `status='published'`. Admin client (service role) used for the public portfolio page to bypass RLS.

---

## Global Index Reference

### United States
| Index | ETF | Expense Ratio |
|---|---|---|
| S&P 500 | SPY / VOO | 0.03–0.09% |
| Nasdaq 100 | QQQ / QQQM | 0.15–0.20% |
| Dow Jones | DIA | 0.16% |
| Russell 2000 | IWM | 0.19% |
| S&P 400 MidCap | MDY / IJH | 0.05–0.23% |
| Total US Market | VTI / ITOT | 0.03% |
| S&P 500 Equal Weight | RSP | 0.20% |
| S&P 500 Value | VOOV / IVE | 0.04–0.18% |
| S&P 500 Growth | VOOG / IVW | 0.04–0.18% |
| Russell 1000 | IWB | 0.15% |

### Europe
| Index | ETF | Expense Ratio |
|---|---|---|
| FTSE 100 (UK) | ISF / EWU | 0.07–0.50% |
| Euro Stoxx 50 | FEZ | 0.29% |
| DAX 40 (Germany) | EWG | 0.50% |
| CAC 40 (France) | EWQ | 0.50% |
| STOXX Europe 600 | EXSA / IEV | 0.20% |
| Swiss Market Index | EWL | 0.50% |
| IBEX 35 (Spain) | EWP | 0.50% |
| AEX 25 (Netherlands) | EWN | 0.50% |
| OMX Stockholm 30 | EWD | 0.53% |
| FTSE MIB (Italy) | EWI | 0.50% |

### Asia-Pacific
| Index | ETF | Expense Ratio |
|---|---|---|
| Nikkei 225 (Japan) | EWJ | 0.50% |
| Hang Seng (HK) | EWH | 0.50% |
| CSI 300 (China) | ASHR | 0.65% |
| KOSPI (S. Korea) | EWY | 0.57% |
| S&P/ASX 200 (Aus) | EWA | 0.50% |
| Nifty 50 (India) | INDA | 0.64% |
| Taiwan Weighted | EWT | 0.57% |
| Straits Times (SG) | EWS | 0.50% |

### Americas (ex-US)
| Index | ETF | Expense Ratio |
|---|---|---|
| S&P/TSX (Canada) | EWC | 0.50% |
| Bovespa (Brazil) | EWZ | 0.57% |
| IPC Mexico | EWW | 0.50% |
| S&P Latin America 40 | ILF | 0.48% |

### Middle East & Africa
| Index | ETF | Expense Ratio |
|---|---|---|
| Tadawul (Saudi) | KSA | 0.74% |
| Tel Aviv 125 | EIS | 0.57% |
| JSE Top 40 (SA) | EZA | 0.57% |
| MSCI UAE | UAE | 0.59% |

### Global
| Index | ETF | Expense Ratio |
|---|---|---|
| MSCI World | URTH | 0.24% |
| MSCI ACWI | ACWI | 0.32% |
| FTSE All-World | VT | 0.06% |
| MSCI Emerging Markets | EEM / VWO | 0.08–0.68% |
| FTSE Developed ex-US | VEA | 0.05% |
| MSCI EAFE | EFA | 0.32% |

### Sectors & Themes
| Theme | ETF | Expense Ratio |
|---|---|---|
| Global Technology | IXN / VGT | 0.10–0.40% |
| Global Healthcare | IXJ | 0.40% |
| Semiconductors | SMH / SOXX | 0.25–0.35% |
| AI & Robotics | BOTZ | 0.68% |
| Cybersecurity | CIBR | 0.60% |
| Clean Energy | ICLN | 0.40% |
| Global REITs | REET | 0.14% |

### Fixed Income
| Index | ETF | Expense Ratio |
|---|---|---|
| Bloomberg US Aggregate | AGG / BND | 0.03% |
| Bloomberg Global Aggregate | BNDX | 0.07% |
| US Treasury 20yr+ | TLT | 0.15% |
| US High Yield | HYG / JNK | 0.40% |
| TIPS | TIP / SCHP | 0.03% |

### Commodities & Crypto
| Asset | ETF | Expense Ratio |
|---|---|---|
| Gold | GLD / IAU | 0.10–0.40% |
| Silver | SLV | 0.50% |
| Crude Oil (WTI) | USO | 0.60% |
| Bloomberg Commodity | PDBC | 0.59% |
| Bitcoin spot | IBIT / FBTC | 0.12–0.25% |
| Ethereum spot | ETHA | 0.25% |

---

## Quote Strategy

1. **Dashboard / Trade page**: POST `/api/quotes` with array of tickers → Finnhub REST (cached 5 min via Next.js `revalidate`)
2. **Benchmarks**: GET `/api/benchmarks` → fetches 90-day candles for SPY, QQQ, EWU, caches in `benchmark_data` table, refreshes if no row for today
3. **Public portfolio**: Finnhub called server-side with `revalidate: 60` — page refreshes every 60 seconds
4. **Mock fallback**: If no `FINNHUB_API_KEY`, all routes return deterministic mock data so the app runs without any API key

---

## Deployment

```bash
# 1. Clone and install
git clone <repo>
cd portfolio-tracker
npm install

# 2. Set up Supabase
# Create project at supabase.com
# Run supabase/migrations/001_initial_schema.sql in SQL editor

# 3. Configure environment
cp .env.local.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, FINNHUB_API_KEY, NEXT_PUBLIC_SITE_URL

# 4. Run locally
npm run dev

# 5. Deploy
vercel --prod
# or push to GitHub and connect to Vercel
```

---

## Enhancement Roadmap

### Near-term
- Daily snapshot automation (cron job or Supabase Edge Function) for continuous performance history chart
- Dividend tracking and calendar
- Earnings date alerts for held stocks
- CSV import from brokerage export formats
- Add MSCI World (ACWI) as a 4th benchmark in the production app (prototype already includes it)

### Medium-term
- Options tracking (calls/puts with strike, expiry, premium)
- Multi-currency support with FX conversion
- Max drawdown chart and rolling return chart
- Monte Carlo simulation for portfolio projections
- Tax lot tracking (FIFO/LIFO)

### Long-term
- PWA with offline support and add-to-home-screen
- News feed per ticker (Finnhub news API)
- AI-assisted journal thesis suggestions
- Natural language trade entry ("buy 50 AAPL at market")
- Leaderboard / portfolio comparison mode
- Google Sheets sync via Apps Script

---

## Prototype vs Production comparison

| Feature | `index.html` prototype | `portfolio-tracker/` app |
|---|---|---|
| Performance chart | ✅ 5-year seeded mock data | ⚠️ Snapshot-based history only |
| Benchmarks | ✅ S&P 500, NASDAQ, FTSE 100, MSCI World, Portfolio | ⚠️ S&P 500, NASDAQ, FTSE 100 |
| Period selector | ✅ 1M / 3M / 6M / YTD / 1Y / 3Y / 5Y / All / Custom | ❌ Not yet |
| Rolling Sharpe (90d–730d) | ✅ With crosshair tooltip | ❌ Not yet |
| Sharpe calculator | ✅ Custom date range, all series | ❌ Not yet |
| Time Machine | ✅ Snapshot-based holdings/alloc | ❌ Not yet |
| Sector allocation | ✅ Dynamic horizontal bars | ✅ |
| Country allocation | ✅ Dynamic horizontal bars | ❌ Not yet |
| Public view preview | ✅ Full mirrored read-only page | ✅ Separate `/portfolio` route |
| Global Indexes (110+) | ✅ With search | ✅ |
| Trade log | ✅ Mock data | ✅ Live Supabase data |
| Authentication | ❌ Mock only | ✅ Supabase auth |
| Live quotes | ❌ Mock only | ✅ Finnhub API |
