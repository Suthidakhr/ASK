---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-AlphaBrief-2026-06-20/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-AlphaBrief-2026-06-20/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-AlphaBrief-2026-06-20/EXPERIENCE.md"
  - "_bmad-output/project-context.md"
---

# AlphaBrief - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AlphaBrief, decomposing the requirements from the PRD, UX Design specs (DESIGN.md + EXPERIENCE.md), and Architecture decisions into implementable stories.

---

## Requirements Inventory

### Functional Requirements

FR-N01: The system shall collect financial news from a curated set of trusted sources via n8n workflows on a scheduled basis. Minimum frequency: every 30 minutes during market hours (09:00–18:00 Bangkok time); at least once every 2 hours outside market hours.

FR-N02: Each news item shall be stored with the following fields, all non-nullable: headline, source name, source URL, publication timestamp (timezone-aware), category tag, and raw content body.

FR-N03: News items shall be organized into exactly one primary category: Global Markets, Thai Stocks, Technology, Energy, or Macroeconomics.

FR-N04: The system shall deduplicate news items by URL and content hash. Duplicate articles from different sources shall not appear as separate items in the feed.

FR-N05: News items shall not appear in the main feed if their publication timestamp is older than 7 days (configurable in the backend).

FR-N06: Every news feed view shall display a "Last updated" timestamp. If the most recent item in a category is older than 60 minutes during market hours, a visible staleness warning shall be displayed.

FR-A01: For every news item, the AI pipeline shall generate: (a) a 2–4 sentence plain-language impact summary, (b) 0–3 affected sectors using standardized labels, (c) 0–5 affected stocks/indices using standard ticker symbols, (d) a sentiment classification — strictly one of: "bullish" | "bearish" | "neutral".

FR-A02: AI analysis shall be triggered automatically via n8n within 5 minutes of a news item being ingested (p90 target).

FR-A03: If AI analysis has not yet completed, the UI shall display the headline, source, and timestamp with an "Analysis pending" state. The article shall not be hidden.

FR-A04: Every surface that renders AI-generated analysis must include the non-removable disclaimer: "AI-generated analysis is for informational purposes only and does not constitute investment advice." No prop, feature flag, or configuration may suppress this.

FR-A05: Sentiment values shall be typed as the union "bullish" | "bearish" | "neutral" at every layer (Pydantic schema, TypeScript type, UI). Free-form string values are not acceptable.

FR-A06: The AI analysis timestamp shall be displayed alongside each analysis. If an analysis is older than 24 hours, a staleness indicator shall be shown.

FR-A07: AI analysis shall always display the source article headline and a link to the original article. Analysis shall never appear detached from its attributed source.

FR-T01: The AI pipeline shall group related news items into named market themes. Each theme shall contain: a name, a 2–3 sentence description, a list of 2–8 constituent news items with individual analysis, and an overall theme sentiment.

FR-T02: The Trends view shall display all currently active themes as cards, ordered by recency of the most recent constituent article.

FR-T03: Users shall be able to expand a theme card to see all constituent articles with individual AI impact summaries and sentiment classifications.

FR-T04: Themes older than 48 hours with no new constituent articles shall be automatically archived and removed from the primary Trends view.

FR-D01: The system shall generate one Daily Brief per calendar day containing: (a) overall market sentiment (bullish/bearish/neutral), (b) 3–5 key market developments in plain language, (c) AI-identified notable opportunities, (d) AI-identified notable risks.

FR-D02: The Daily Brief shall be the primary entry point on the home page, rendered at the top, always reflecting the current day's brief.

FR-D03: If the current day's brief has not yet been generated, the previous day's brief shall remain visible with a clear date label and a "Today's brief is being prepared" status indicator.

FR-D04: Daily Brief generation shall be triggered via n8n at a fixed daily time (proposed default: 07:00 Bangkok time / UTC+7). The trigger time is configurable.

FR-D05: The Daily Brief shall display its generation timestamp and include the disclaimer: "AI-generated market summary for informational purposes only. Not investment advice."

FR-UX01: The application shall have a primary navigation with four sections: Home (Daily Brief), News (by category), Trends, and About / Disclaimer.

FR-UX02: The News view shall support filtering by the five defined categories. Default view shows all categories combined, sorted by publication time descending.

FR-UX03: Each news item in a list view shall display: headline, source name, publication time (relative format), category tag, and AI sentiment badge (bullish/bearish/neutral with color coding).

FR-UX04: Sentiment and market direction color coding shall follow: green = positive/bullish, red = negative/bearish, gray = neutral. Enforced at the data layer — not as CSS convention.

FR-UX05: Clicking a news item shall open a detail view showing: headline, source name (non-nullable, visible text) with link to original article (non-nullable), publication timestamp, AI impact summary, affected sectors, affected stocks/indices, sentiment classification, analysis timestamp, and disclaimer.

FR-UX06: All financial data displays shall surface data freshness. If a feed or analysis item has not been updated within the ISR window (60 seconds), a visible staleness state shall render.

FR-UX07: Error states shall never display empty or silent components. API failures and data-unavailable states shall render an explicit, timestamped "Data currently unavailable" message.

---

### Non-Functional Requirements

NFR-P01: Largest Contentful Paint (LCP) on the home page shall be under 2.5 seconds on a standard broadband connection (desktop, Chrome).

NFR-P02: News feed content shall refresh via ISR within 60 seconds of new content being published to the backend.

NFR-P03: AI analysis pipeline (n8n → Claude → API) shall complete within 5 minutes of article ingestion at p90.

NFR-R01: All n8n webhook endpoints in FastAPI shall be idempotent. Duplicate webhook deliveries shall not produce duplicate records. Use payload hash or event ID for deduplication.

NFR-R02: The application shall degrade gracefully when the AI pipeline is delayed. News items shall remain accessible without analysis; "Analysis pending" state shall render, not an error.

NFR-R03: The application shall remain usable if any single data category is unavailable, without blocking other sections.

NFR-D01: Source attribution (publisher name + original URL) must be non-nullable at every layer: n8n ingestion schema, Pydantic model, API response, and UI display.

NFR-D02: All numeric financial values shall include an isFinite() guard before display formatting. NaN values shall never be rendered to the DOM.

NFR-D03: All datetime fields from the API shall be timezone-aware (UTC). The frontend shall convert to Bangkok time (UTC+7) for display. Timezone-naive datetimes must not reach the UI layer.

NFR-AI01: The AI system prompt defining analysis constraints (no price predictions, no specific security recommendations, mandatory disclaimer language) shall be version-controlled in the repository as application code — not an editable runtime string.

NFR-AI02: A manual spot-check process for sentiment classification accuracy shall be established before public launch. Target: fewer than 15% incorrect sentiment tags on a random 20-item sample.

NFR-C01: Every component or page that renders AI-generated content must display the informational disclaimer (non-negotiable; cannot be overridden by configuration).

NFR-C02: The product must clearly communicate its non-advisory positioning on the About / Disclaimer page: scope of AI analysis, data sources used, limitations of AI-generated content, and absence of regulatory authorization.

NFR-ACC01: The web application shall meet WCAG 2.1 AA standards for color contrast ratios. Sentiment color coding must be accompanied by a secondary non-color indicator (dot + label or arrow) for color-blind users.

---

### Additional Requirements (Architecture)

- **Codebase is already bootstrapped** — no new project initialization needed. Frontend (Next.js 15, 4 pages, 9 components, lib/api.ts, types/index.ts) and backend (FastAPI, 3 routers for news/market/trends, schemas, mock_data service) are standing.
- **Testing infrastructure not yet in place** — must be added: Vitest + React Testing Library (frontend); pytest + pytest-asyncio + httpx.AsyncClient via ASGITransport (backend). This is an early epic priority.
- **No database in MVP** — data is in-memory/mock. Architecture must accommodate the PostgreSQL transition cleanly (ConfigDict(from_attributes=True), AwareDatetime on all fields, non-nullable enforcement at schema level).
- **n8n webhook UUIDs are live credentials** — must live in environment variables (.env), never hardcoded. Rotatable without code deploy.
- **Idempotency on all n8n-facing FastAPI POST endpoints** — payload hash or event_id dedup required. n8n retries failed webhooks; duplicates are a data integrity problem.
- **Schema sync discipline** — TypeScript types in types/index.ts and Pydantic models in schemas.py are manually kept in sync. snake_case on both sides. No `alias=` in Pydantic ever.
- **Sentiment type safety** — "bullish" | "bearish" | "neutral" enforced as a union at Pydantic, TypeScript, and UI layers. Validated with type predicates at the api.ts boundary.
- **Numeric safety** — isFinite() guard before every toFixed() or Math.abs() on financial figures; falsy-length guard (data.length > 0, not data.length &&).
- **Server/client boundary** — NEXT_PUBLIC_ vars exposed to browser; never store credentials there. Client components are leaf nodes; never convert a Server Component page to use client without strong justification.
- **Suspense boundaries** — every async Server Component fetching financial data requires `<Suspense fallback={<SkeletonCard />}>`. Missing boundary causes silent production failures.
- **ISR consistency** — 60s revalidate must be consistent for the same URL across all calls in api.ts. Real-time exceptions: `export const dynamic = 'force-dynamic'` and documented.
- **AwareDatetime** — Pydantic v2 AwareDatetime on all datetime fields; UTC storage, UTC+7 display on frontend.

---

### UX Design Requirements

UX-DR01: Implement color token system in tailwind.config.ts — all 17 tokens from DESIGN.md frontmatter: espresso (#4A342A), cocoa (#7D5A44), camel (#B2967D), khaki (#D7C9B8), linen (#F5F1EA), linen-deep (#EDE8E0), positive (#15803d), positive-bg (#dcfce7), positive-border (#86efac), negative (#dc2626), negative-bg (#fee2e2), negative-border (#fca5a5), neutral-text (#6b6560), neutral-bg (#f5f5f4), neutral-border (#e7e5e4), staleness (#d97706), white (#ffffff). [Status: Done — already in tailwind.config.ts]

UX-DR02: Implement Inter font via next/font/google with CSS variable --font-inter; monospace stack (ui-monospace, SFMono-Regular) for timestamps, ticker symbols, and price figures.

UX-DR03: Build Navbar component — 56px height, espresso bg, sticky z-50. Logo left, nav tabs center with 2px khaki bottom-border active indicator, live Bangkok clock + LIVE badge right. Bilingual labels: English primary, Thai sub-label with aria-hidden="true" at 90% opacity.

UX-DR04: Build Ticker Bar component — fixed h-10 bar below navbar, horizontal CSS marquee (no JS), auto-scroll, pause on hover (desktop). Each item: SYMBOL ▲/▼ +X.XX% in monospace. aria-hidden="true" (decorative). Pause when prefers-reduced-motion: reduce.

UX-DR05: Build NewsCard component — scan order: headline (15px 700 espresso) + SentimentBadge top-right → AIInsightBox → stock impact badges row (▲/▼/– + ticker, aria-label="[SYM]: rising/falling/unchanged") → khaki divider → footer (source name · relative time + category tag right). Full card is clickable. Featured card: 3px camel left border.

UX-DR06: Build SentimentBadge component — pill, always dot + text label (● BEARISH / ● BULLISH / ● NEUTRAL). Never color alone. aria-label="Market sentiment: bearish/bullish/neutral". Three states. Used at article level and theme level.

UX-DR07: Build AIInsightBox component — linen bg (#F5F1EA), 2px camel (#B2967D) left border, 6px radius, no visible label. aria-label="AI market analysis" or visually-hidden heading. Pending state: "Analysis in progress" in cocoa (#7D5A44) full opacity 400 weight (not camel opacity). Animated dot paused when prefers-reduced-motion: reduce. Stale state: amber inline indicator (staleness token) if >24h.

UX-DR08: Build DailyBriefCard component — two zones: Zone 1 (espresso header: "AI Daily Brief" wordmark + "ภาพรวมตลาด" + SentimentBadge + generation date), Zone 2 (white body: overview + numbered key points + inline non-removable disclaimer text FR-D05: "AI-generated market summary for informational purposes only. Not investment advice." 10px neutral-text, never a link). Pending state: yesterday's brief with "Today's brief is being prepared." Position: sidebar desktop, top of page mobile.

UX-DR09: Build ThemeCard component — Trends page: theme name (16px 700 espresso) + SentimentBadge + article count, 2-3 sentence description (cocoa 14px), khaki divider, "Latest:" preview headline (12px neutral-text italic), footer timestamp. Padding 20px 24px, card gap 16px. Constituent article staleness indicator on Theme Detail page. ThemeCard uses <article> element.

UX-DR10: Build Category Filter Bar — horizontal scrollable row; tabs: All · Global Markets · Thai Stocks · Technology · Energy · Macroeconomics. role="tablist" on container, role="tab" + aria-selected on each tab, left/right arrow key nav. Active: cocoa underline + espresso text. Inactive: neutral-text. URL query param reflects active filter (/news?category=energy). Minimum 44px height.

UX-DR11: Build MarketOverviewWidget — index rows with name (12px 600 cocoa) + current value (mono espresso) + direction change (▲/▼/– arrow + percentage in positive/negative color). Arrow is the non-color indicator — required. Loading: skeleton rows. Error: timestamped "Market data unavailable" message, never silent.

UX-DR12: Build SectorHeatmap widget — sector cells each showing sector name + percentage change text (both are non-color indicators per WCAG 1.4.1). Cell background as secondary visual confirmation. Loading: skeleton grid. Error: timestamped message.

UX-DR13: Build TrendSummary sidebar widget — ranked list of active themes, each row: theme name (13px 500 espresso) + SentimentBadge right-aligned. Clicking navigates to /trends/[id]. Empty: "No active themes today." Loading: 3 skeleton rows.

UX-DR14: Implement two-column desktop layout — grid-cols-[1fr_340px] at lg: breakpoint; left column: news feed (fluid); right column: sidebar widgets stacked: DailyBriefCard → MarketOverviewWidget → SectorHeatmap → TrendSummary. Page padding px-4 py-5, card gap 10px.

UX-DR15: Implement BottomTabBar (mobile only) — 56px espresso bg, fixed z-50, safe area inset. Four tabs: Overview / News / Stocks / Trends. Each: 24px SVG icon + English label + Thai aria-hidden sub-label. Active: khaki icon/text + 2px border-top khaki. Inactive: white 45% opacity. Min 44×44px tap targets.

UX-DR16: Implement skeleton/loading states — animate-pulse linen (#F5F1EA) blocks at approximate content dimensions. No spinner. No "Loading..." text. Every async Server Component fetching financial data requires <Suspense fallback={<SkeletonCard />}>.

UX-DR17: Implement staleness indicators — (1) Feed staleness: amber banner above feed if most recent article >60 min old during market hours (09:00–18:00 BKK): "Last updated [time] · New articles may be delayed" using staleness token #d97706. (2) Analysis staleness: inline amber indicator below insight box if AI analysis >24h old: clock icon + "Analysis from [relative time]" — clock emoji gets aria-hidden="true" with visible textual description.

UX-DR18: Implement error/unavailable states at three levels — (1) Full-page: espresso icon + "Market data temporarily unavailable" + timestamp + recovery message. (2) Category-feed: unavailable card inline for failed category; other categories continue. (3) Individual card: "Content unavailable" with source link if URL available. All include "Last attempted [time]". Empty state (genuine no articles): category illustration + "No new articles in [Category] today." + market hours note.

UX-DR19: Build Search component — single-line input with magnifier icon. aria-label="Search news, stocks, and sectors" (explicit; placeholder alone fails WCAG 1.3.1). Placeholder: "Search news, stocks, sectors... / ค้นหา". Border: khaki. Focus ring: espresso double-ring. Results scoped to news feed.

UX-DR20: Implement WCAG 2.1 AA accessibility floor — (1) Focus ring: box-shadow: 0 0 0 2px #fff, 0 0 0 4px #4A342A on all interactive elements. (2) Full tab order: navbar, feed, cards, filters, skip-to-content as first focusable element. (3) Screen reader: NewsCards and ThemeCards use <article>; landmark roles <header> <nav> <main> <footer>; AI insight box aria-label; Thai subtitles aria-hidden. (4) Motion: global @media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } } covers ticker, skeleton, animated dot, card transitions. (5) Touch targets: all ≥44×44px.

UX-DR21: Implement News Detail page (/news/[id]) — content order: headline → source name (non-nullable visible text) + original article link (non-nullable) + pub timestamp → full AI impact analysis → affected sectors list → affected stocks/indices (with ▲/▼/– direction) → SentimentBadge → analysis timestamp + amber staleness if >24h → AI disclaimer non-removable. States: 404 → "Article not found" + back nav; cold-load → Suspense skeleton; AI pending → "Analysis in progress" in cocoa; AI error → "Analysis unavailable" with source still accessible.

UX-DR22: Implement Theme Detail page (/trends/[id]) — content: theme name + SentimentBadge, date range, 2-3 sentence description, constituent articles (each as NewsCard format with AI analysis + sentiment + staleness indicator), non-removable AI disclaimer (FR-A04). States: expired theme → redirect to /trends with "This theme has expired" message; error → "Themes currently unavailable" + timestamp.

UX-DR23: Implement empty states for Trends — Trends page with all themes archived (FR-T04): "No active themes today. Themes are refreshed daily at 07:00 Bangkok time." + link to News feed.

UX-DR24: Build About/Disclaimer page (/about) — five required sections: product description and scope, AI analysis limitations, data sources used, no investment advice statement, full regulatory disclaimer. Satisfies NFR-C02.

UX-DR25: Implement additional ARIA patterns — stock impact badges: aria-label="[SYMBOL]: rising/falling/unchanged"; category filter: role="tablist"/role="tab"/aria-selected + arrow key navigation; ThemeCard: <article> element; Search: aria-label; external links: "opens in new tab" announcement or aria-label.

---

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR-N01 | Epic 3 | n8n news ingestion webhook endpoint, scheduling |
| FR-N02 | Epic 2 | Non-nullable field enforcement in schema + API + UI |
| FR-N03 | Epic 2 | Category taxonomy, single-category assignment |
| FR-N04 | Epic 3 | Deduplication by URL + content hash, idempotency |
| FR-N05 | Epic 2 | 7-day retention filter in API response |
| FR-N06 | Epic 2 | Feed staleness banner if >60 min during market hours |
| FR-A01 | Epic 3 | n8n → Claude pipeline output: summary, sectors, stocks, sentiment |
| FR-A02 | Epic 3 | Analysis triggered within 5 min of ingestion (p90) |
| FR-A03 | Epic 2 | "Analysis in progress" state on NewsCard and News Detail |
| FR-A04 | Epic 2 | Non-removable disclaimer on all AI analysis surfaces |
| FR-A05 | Epic 2 | Sentiment typed as union at Pydantic, TypeScript, and UI |
| FR-A06 | Epic 2 | Analysis timestamp + amber staleness indicator if >24h |
| FR-A07 | Epic 2 | Source headline + link always present on analysis surfaces |
| FR-T01 | Epic 5 | n8n theme generation: name, description, constituent articles, sentiment |
| FR-T02 | Epic 5 | Trends page — theme cards ordered by recency |
| FR-T03 | Epic 5 | Theme Detail page — expandable constituent articles with AI summaries |
| FR-T04 | Epic 5 | Auto-archive themes >48h with no new articles |
| FR-D01 | Epic 4 | Daily Brief content: sentiment, 3–5 developments, opportunities, risks |
| FR-D02 | Epic 4 | DailyBriefCard as primary home page entry point |
| FR-D03 | Epic 4 | Graceful fallback to yesterday's brief with "being prepared" indicator |
| FR-D04 | Epic 4 | n8n trigger at 07:00 BKK, configurable |
| FR-D05 | Epic 4 | FR-D05 disclaimer inline in DailyBriefCard footer |
| FR-UX01 | Epic 2 | 4-section navigation (Navbar desktop + BottomTabBar mobile) |
| FR-UX02 | Epic 2 | Category Filter Bar with 5 categories + URL query param |
| FR-UX03 | Epic 2 | NewsCard list fields: headline, source, time, category tag, sentiment badge |
| FR-UX04 | Epic 2 | Color/direction enforcement at data layer (Pydantic + TypeScript unions) |
| FR-UX05 | Epic 2 | News Detail page with all required fields |
| FR-UX06 | Epic 2 | ISR 60s staleness contract in api.ts; staleness states render |
| FR-UX07 | Epic 2 | Explicit timestamped error states at all three levels |

---

## Epic List

### Epic 1: Development Foundation & Quality Infrastructure
Establish testing infrastructure and validate the existing codebase so every subsequent story can be built and verified with confidence. The development team has working test suites for both frontend and backend before any feature work begins.
**FRs covered:** None directly — addresses Architecture requirements (Vitest + RTL frontend, pytest + pytest-asyncio backend, env var validation, idempotency patterns documented, CORS confirmed)

### Epic 2: Core News Feed & Reading Experience
Users can browse AI-analyzed financial news organized by category, view sentiment at a glance on every card, and read full article detail pages — the complete news reading experience from landing page to article, on both desktop and mobile, with full WCAG 2.1 AA accessibility.
**FRs covered:** FR-N02, FR-N03, FR-N05, FR-N06, FR-A03, FR-A04, FR-A05, FR-A06, FR-A07, FR-UX01, FR-UX02, FR-UX03, FR-UX04, FR-UX05, FR-UX06, FR-UX07
**NFRs covered:** NFR-P01, NFR-P02, NFR-D01, NFR-D02, NFR-D03, NFR-R02, NFR-R03, NFR-ACC01, NFR-C01, NFR-C02

### Epic 3: News & AI Analysis Ingestion Pipeline
Real financial news flows into the platform automatically via n8n, and each article receives AI-generated analysis within 5 minutes — the platform transitions from mock data to a live, self-updating product.
**FRs covered:** FR-N01, FR-N04, FR-A01, FR-A02
**NFRs covered:** NFR-R01, NFR-P03, NFR-AI01, NFR-AI02

### Epic 4: Daily Market Brief
Users open AlphaBrief each morning to find an AI-generated summary of overnight market developments at the top of the home page — the daily anchor that drives return visits and delivers UJ-1 (Nam's morning brief journey).
**FRs covered:** FR-D01, FR-D02, FR-D03, FR-D04, FR-D05

### Epic 5: Market Trends & Themes
Users can discover AI-grouped market narratives, understand the thematic story behind multiple related articles, and identify affected Thai stocks — delivering UJ-3 (Wanida's sector sweep journey).
**FRs covered:** FR-T01, FR-T02, FR-T03, FR-T04

### Epic 6: Market Context Widgets
Users see rich market context alongside the news feed — a live ticker bar, index performance widget, sector heatmap, and trend summary in the sidebar — completing the research companion experience.
**UX-DRs covered:** UX-DR04 (Ticker Bar), UX-DR11 (MarketOverviewWidget), UX-DR12 (SectorHeatmap), UX-DR13 (TrendSummary), UX-DR14 (full sidebar composition)

---

## Epic 6: Market Context Widgets

Users see rich market context alongside the news feed — a live ticker bar, index performance widget, sector heatmap, and trend summary in the sidebar — completing the full research companion experience.

### Story 6.1: Market Data Schema, API Endpoints & Ingestion Webhooks

As a developer,
I want the `MarketSnapshot` and `SectorPerformance` Pydantic schemas defined with API endpoints and idempotent ingestion webhooks,
So that all market context widgets share a single typed data contract and n8n has a clear path to push live market data.

**Acceptance Criteria:**

**Given** `TickerItem` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `symbol` (str), `price` (float), `change_pct` (float), `direction` (Literal["positive", "negative", "neutral"])

**Given** `IndexItem` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `name` (str), `value` (float), `change_pct` (float), `direction` (Literal["positive", "negative", "neutral"])

**Given** `MarketSnapshot` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `indices` (list[IndexItem]), `tickers` (list[TickerItem]), `market_open` (bool), `snapshot_at` (AwareDatetime)

**Given** `SectorPerformance` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `sector_name` (str), `change_pct` (float), `direction` (Literal["positive", "negative", "neutral"]), `top_article_id` (str | None), `updated_at` (AwareDatetime)

**Given** TypeScript types in `frontend/src/types/index.ts`
**When** `TickerItem`, `IndexItem`, `MarketSnapshot`, and `SectorPerformance` are defined
**Then** they mirror the Pydantic schemas exactly — snake_case, no `alias=`, `direction` typed as `"positive" | "negative" | "neutral"` (not `string`)
**And** `price`, `change_pct`, and `value` are typed `number` — `isFinite()` must be applied before any `toFixed()` or `Math.abs()` call at the formatting layer (NFR-D02)

**Given** `GET /api/market/snapshot`
**When** called and a snapshot exists
**Then** it returns the most recent `MarketSnapshot` — only one "current" snapshot is retained at a time in MVP
**And** the `api.ts` fetch call uses `next: { revalidate: 60 }`

**Given** `GET /api/market/snapshot` when no snapshot has been pushed yet
**When** called
**Then** it returns `HTTP 404` — the frontend renders the widget error state, not a blank card

**Given** `GET /api/market/sectors`
**When** called
**Then** it returns the current `list[SectorPerformance]` for all sectors
**And** the `api.ts` fetch call uses `next: { revalidate: 60 }`

**Given** `POST /webhooks/market-snapshot` receives a valid `MarketSnapshot` payload
**When** called
**Then** it returns `HTTP 200` with `{"status": "updated"}` — it always overwrites the single current snapshot (no history retained in MVP)
**And** a timezone-naive `snapshot_at` returns `HTTP 422`

**Given** `POST /webhooks/sector-performance` receives a valid `list[SectorPerformance]`
**When** called
**Then** it returns `HTTP 200` with `{"status": "updated"}` — all sector rows are replaced atomically
**And** a timezone-naive `updated_at` on any item returns `HTTP 422`

**Given** integration tests for both webhooks
**When** they run
**Then** an invalid `direction` value (e.g., `"up"`) on any item returns `HTTP 422`
**And** after a successful POST, the corresponding GET endpoint returns the updated data

---

### Story 6.2: Ticker Bar Component

As a retail investor,
I want a continuously scrolling ticker below the navbar showing live stock prices and daily percentage changes,
So that I can monitor market direction at a glance without navigating away from any page.

**Acceptance Criteria:**

**Given** `TickerBar` receives a `MarketSnapshot`
**When** it renders
**Then** it is a fixed `h-10` bar (40px) positioned directly below the Navbar, above all page content
**And** each ticker item renders as: `SYMBOL` (monospace, espresso) + `▲`/`▼`/`–` arrow + `+X.XX%` or `-X.XX%` in `positive` / `negative` / `neutral-text` color
**And** the `▲`/`▼`/`–` arrow is the required non-color direction indicator — never color alone (NFR-ACC01)
**And** `price` and `change_pct` values have `isFinite()` applied before formatting — `NaN` is never rendered to the DOM

**Given** the scroll animation
**When** it plays
**Then** it is implemented as a CSS marquee with `animation: scroll linear infinite` — no JavaScript scroll loop
**And** on desktop, the animation pauses on `hover`
**And** when `prefers-reduced-motion: reduce` is active, the animation is paused and ticker items are visible statically (UX-DR04)

**Given** the `TickerBar` container
**When** a screen reader encounters it
**Then** the container has `aria-hidden="true"` — it is decorative; the same data is accessible via `MarketOverviewWidget` in a semantically structured form (UX-DR04)

**Given** `market_open` is `false` in the snapshot
**When** `TickerBar` renders
**Then** a "Market closed" badge appears using the `staleness` token (`#d97706`) — consistent with the platform staleness language

**Given** `GET /api/market/snapshot` returns `HTTP 404` or an error
**When** `TickerBar` renders
**Then** the bar renders with a static "Market data unavailable" message at the same height — the Navbar layout does not shift

---

### Story 6.3: MarketOverviewWidget Component

As a retail investor,
I want to see the SET index and major market benchmarks in the sidebar,
So that I understand the macro direction before reading individual news articles.

**Acceptance Criteria:**

**Given** `MarketOverviewWidget` receives a `MarketSnapshot`
**When** it renders
**Then** each `IndexItem` renders as a row: index name (12px, 600, cocoa) + current `value` (monospace, espresso) + `▲`/`▼`/`–` arrow + percentage change in `positive` / `negative` / `neutral-text` color
**And** the `▲`/`▼`/`–` arrow is the required non-color indicator — never percentage alone (UX-DR11)
**And** `value` and `change_pct` have `isFinite()` applied before `toFixed()` — `NaN` never reaches the DOM

**Given** `market_open` is `false` in the snapshot
**When** the widget renders
**Then** an amber note appears: "Market closed · As of [snapshot_at in Bangkok time]" using the `staleness` token

**Given** the widget is inside a `<Suspense>` boundary
**When** data is loading
**Then** skeleton rows appear: `animate-pulse linen` blocks at approximate index row dimensions — no spinner, no blank area

**Given** `GET /api/market/snapshot` returns an error or `HTTP 404`
**When** the widget renders
**Then** it shows: "Market data unavailable · Last attempted [time]" — never silent or blank (UX-DR11)

**Given** any interactive elements in the widget
**When** focused via keyboard
**Then** the espresso double-ring focus indicator is visible

---

### Story 6.4: SectorHeatmap Component

As a retail investor,
I want to see all sectors' daily performance in a visual grid,
So that I can immediately identify which sector is driving market movement before choosing which articles to read.

**Acceptance Criteria:**

**Given** `SectorHeatmap` receives a `list[SectorPerformance]`
**When** it renders
**Then** each sector renders as a cell showing: sector name (visible text) + percentage change (visible text with `+`/`–` prefix)
**And** both sector name and percentage text are visible non-color indicators — color fill is only the secondary visual layer (WCAG 1.4.1, UX-DR12)
**And** `change_pct` has `isFinite()` applied before formatting — `NaN` never reaches the DOM

**Given** cell background fill colors
**When** applied
**Then** `positive-bg` (`#dcfce7`) for positive, `negative-bg` (`#fee2e2`) for negative, `neutral-bg` (`#f5f5f4`) for neutral cells
**And** percentage text uses `positive` / `negative` / `neutral-text` — all verified ≥ 4.5:1 against their respective backgrounds

**Given** any sector cell
**When** clicked
**Then** it navigates to `/news?category=[sector_name]` — the filtered news feed, regardless of whether `top_article_id` is null

**Given** the widget is inside a `<Suspense>` boundary
**When** data is loading
**Then** skeleton cells render at approximate heatmap grid dimensions — `animate-pulse linen`, no spinner

**Given** `GET /api/market/sectors` returns an error
**When** the widget renders
**Then** it shows: "Sector data unavailable · Last attempted [time]" — never silent or blank (UX-DR12)

**Given** all interactive sector cells
**When** focused via keyboard
**Then** the espresso double-ring focus indicator is visible on each cell

---

### Story 6.5: TrendSummary Widget & Full Sidebar Composition

As a retail investor,
I want to see the top active market themes in a compact sidebar widget and a fully composed home page sidebar,
So that I can jump to a theme without navigating to the Trends page, and so the complete right-column research context is available in a single scroll.

**Acceptance Criteria:**

**Given** `TrendSummary` fetches from `GET /api/trends` (same endpoint as Epic 5's Trends page)
**When** it renders with active themes
**Then** it shows the top 3 themes by `last_article_at` descending — each row: theme name (13px, 500, espresso) + `SentimentBadge` right-aligned
**And** clicking a row navigates to `/trends/[theme_id]`
**And** a "View all trends →" link at the bottom navigates to `/trends`
**And** the `api.ts` call uses `next: { revalidate: 60 }` — consistent ISR with the Trends page for the same URL

**Given** `GET /api/trends` returns an empty list
**When** `TrendSummary` renders
**Then** it shows: "No active themes today." — never a silent empty widget

**Given** the widget is inside a `<Suspense>` boundary
**When** data is loading
**Then** three skeleton rows render: `animate-pulse linen` blocks at approximate row height (UX-DR13)

**Given** `GET /api/trends` returns an error
**When** `TrendSummary` renders
**Then** it shows: "Trends unavailable · Last attempted [time]"

**Given** the home page `/` on desktop (≥ 1024px) after Epic 6 is complete
**When** it renders
**Then** the right sidebar column (340px, `grid-cols-[1fr_340px]`, `lg:` breakpoint) shows widgets stacked top-to-bottom: `DailyBriefCard` → `MarketOverviewWidget` → `SectorHeatmap` → `TrendSummary` (UX-DR14)
**And** each widget has a 10px card gap
**And** each widget is inside its own `<Suspense fallback={<SkeletonCard />}>` boundary — one widget failing does not collapse the others

**Given** the n8n market data workflows
**When** configured
**Then** `POST /webhooks/market-snapshot` and `POST /webhooks/sector-performance` are triggered every 15 minutes during market hours (09:00–18:00 Bangkok time) and paused outside market hours
**And** both webhook URLs are stored in n8n environment variables — never hardcoded

**Given** a Lighthouse audit of the completed home page
**When** LCP is measured on desktop broadband
**Then** LCP remains under 2.5 seconds with all 4 sidebar widgets present — all widgets are Server Components with ISR, no client-side data fetching on initial load (NFR-P01)

---

## Epic 5: Market Trends & Themes

Retail investors can discover the thematic patterns driving today's market — browsing AI-clustered theme cards on the Trends page and drilling into a theme to see all constituent articles with individual AI analysis.

### Story 5.1: Market Themes Schema & API Endpoints

As a developer,
I want the `MarketTheme` Pydantic schemas defined and two API endpoints — a list view and a detail view — with 48-hour auto-archiving applied at query time,
So that subsequent stories have a reliable data contract and the themes feed always reflects only active clusters.

**Acceptance Criteria:**

**Given** `MarketThemeSummary` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `theme_id` (str), `name` (str), `description` (str, 2–3 sentences), `overall_sentiment` (Literal["bullish", "bearish", "neutral"]), `article_count` (int), `last_article_at` (AwareDatetime), `created_at` (AwareDatetime)
**And** it does NOT contain the full constituent articles list — the list view payload stays compact

**Given** `MarketTheme` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains all `MarketThemeSummary` fields plus `constituent_articles` (list[NewsItem]) — full `NewsItem` objects including `ai_analysis` (populated or null)

**Given** TypeScript types in `frontend/src/types/index.ts`
**When** `MarketThemeSummary` and `MarketTheme` are defined
**Then** they mirror the Pydantic schemas exactly — snake_case, no `alias=`, `overall_sentiment` typed as `"bullish" | "bearish" | "neutral"` (not `string`), `ai_analysis` typed as `AIAnalysis | null`

**Given** `GET /api/trends`
**When** called
**Then** it returns a list of `MarketThemeSummary` sorted by `last_article_at` descending (FR-T02)
**And** themes where `last_article_at` is older than 48 hours are excluded — filtered at query time, not via a background job (FR-T04)
**And** the `api.ts` fetch call uses `next: { revalidate: 60 }` — consistent with the global ISR strategy

**Given** `GET /api/trends` when all themes are older than 48 hours
**When** called
**Then** it returns an empty list `[]` — not an error, not `HTTP 404`

**Given** `GET /api/trends/{id}` with a valid, active theme ID
**When** called
**Then** it returns a `MarketTheme` with `constituent_articles` sorted by `published_at` descending
**And** each article includes its `ai_analysis` (null if not yet available)

**Given** `GET /api/trends/{id}` where `last_article_at` is older than 48 hours
**When** called
**Then** it returns `HTTP 410 Gone` — the theme is archived; not `HTTP 404`, which implies it never existed

**Given** `GET /api/trends/{id}` with a non-existent ID
**When** called
**Then** it returns `HTTP 404`

**Given** integration tests
**When** they run
**Then** the 48-hour filter is tested: a theme with `last_article_at` 47h 59m ago appears; one 48h 1m ago does not
**And** all `overall_sentiment` values in responses are always one of the three valid strings
**And** all datetime fields parse as timezone-aware ISO 8601 strings

---

### Story 5.2: ThemeCard Component & Trends Page

As a retail investor,
I want to browse AI-identified market themes on a dedicated Trends page with clear loading, empty, and error states,
So that I can spot the macro patterns driving today's market in a single scan.

**Acceptance Criteria:**

**Given** a `ThemeCard` receives a `MarketThemeSummary`
**When** it renders
**Then** scan order top-to-bottom is: theme name (16px, 700, espresso) + `SentimentBadge` (right-aligned) → article count (cocoa, 12px) → description (cocoa, 14px) → khaki divider → footer (relative time of `last_article_at`)
**And** the full card surface is a single clickable area navigating to `/trends/[theme_id]`
**And** the card is wrapped in an `<article>` element

**Given** the `/trends` page loads
**When** it renders
**Then** `ThemeCard` components appear sorted by `last_article_at` descending, with a 16px vertical gap
**And** the page has a visible `<h1>` of "Market Trends" and `role="main"` landmark

**Given** all async components on `/trends`
**When** the page loads
**Then** each is wrapped in `<Suspense fallback={<SkeletonCard />}>` — skeleton shows `animate-pulse linen` blocks at approximate `ThemeCard` dimensions

**Given** `GET /api/trends` returns an empty list
**When** the page renders
**Then** it shows: "No active themes right now. Themes refresh daily. Check back after market hours (18:00 Bangkok time)." with a link to `/news`
**And** it is never a silent empty `<ul>`

**Given** `GET /api/trends` returns an error
**When** the page renders
**Then** it shows: "Market Trends temporarily unavailable · Last attempted [time]"
**And** Navbar and BottomTabBar remain functional

**Given** keyboard focus on a `ThemeCard`
**When** focused
**Then** the espresso double-ring focus indicator is visible on the card container

---

### Story 5.3: Theme Detail Page (`/trends/[id]`)

As a retail investor,
I want to open a theme and read all its constituent articles with individual AI analysis and a compliance disclaimer,
So that I can understand the full evidence base for a market theme before forming a view.

**Acceptance Criteria:**

**Given** `/trends/[id]` loads with a valid, active theme ID
**When** the page renders
**Then** content order is: (1) theme name (`<h1>`) + `SentimentBadge` → (2) article count + date range → (3) theme description → (4) constituent articles as `NewsCard` components (each with `AIInsightBox`, `SentimentBadge`, staleness indicator if `analysis_at` > 24h) → (5) non-removable AI disclaimer
**And** constituent articles are sorted by `published_at` descending

**Given** a constituent article's `analysis_at` is more than 24 hours old
**When** its `AIInsightBox` renders on this page
**Then** the amber staleness indicator appears — the same `AIInsightBox` component as everywhere else, no Theme-Detail-specific staleness logic

**Given** the non-removable AI disclaimer (FR-A04)
**When** a developer inspects the component
**Then** it is a structural part of the Theme Detail page — not a prop, not conditional, not a link to `/about`

**Given** `/trends/[id]` where the theme's `last_article_at` is older than 48 hours (API returns `HTTP 410`)
**When** the page renders
**Then** it shows: "This theme has expired. Themes with no new articles in 48 hours are archived." with a link to `/trends`
**And** it does not throw a Next.js error page

**Given** `/trends/[id]` with a non-existent ID (API returns `HTTP 404`)
**When** the page renders
**Then** it shows: "Theme not found." with a link to `/trends`

**Given** a cold load with no ISR cache
**When** Suspense boundaries resolve
**Then** skeleton blocks cover the article list area — no blank white regions

**Given** a constituent article with `ai_analysis: null`
**When** it renders as a `NewsCard`
**Then** `AIInsightBox` shows the pending state (cocoa, full opacity, 400 weight) — same as on `/news`

---

### Story 5.4: Theme Clustering Webhook & n8n Scheduling

As the n8n/AI pipeline,
I want to push AI-identified market theme clusters into AlphaBrief via a webhook endpoint on a daily schedule,
So that the Trends page reflects the freshest thematic groupings each morning.

**Acceptance Criteria:**

**Given** `POST /webhooks/themes` receives a valid payload
**When** called for a `theme_id` that does not yet exist
**Then** it returns `HTTP 200` with `{"status": "created"}`
**And** the theme appears in `GET /api/trends` if `last_article_at` is within 48 hours

**Given** `POST /webhooks/themes` is called again with the same `theme_id`
**When** the pipeline re-runs or n8n retries
**Then** it returns `HTTP 200` with `{"status": "updated"}` — upsert by `theme_id`, not duplicated

**Given** a payload with `constituent_article_ids` containing an ID that does not exist in the news store
**When** the endpoint receives it
**Then** it returns `HTTP 422` naming the missing article ID — orphan references are rejected at the boundary

**Given** a payload with `overall_sentiment` outside `"bullish" | "bearish" | "neutral"`
**When** the endpoint receives it
**Then** it returns `HTTP 422`

**Given** a payload with a timezone-naive `last_article_at` or `created_at`
**When** the endpoint receives it
**Then** it returns `HTTP 422` (NFR-D03)

**Given** the n8n theme clustering workflow
**When** configured
**Then** it triggers once daily after the news and AI analysis batch completes — exact time configurable without a code deploy
**And** the webhook URL is stored in an n8n environment variable — never hardcoded

**Given** integration tests
**When** they run
**Then** idempotency is verified: same `theme_id` twice → one record, second returns `"updated"`
**And** constituent article ID validation is tested: non-existent `news_id` returns `HTTP 422`
**And** after a successful POST, `GET /api/trends` includes the new theme (if `last_article_at` is within 48 hours)

---

## Epic 4: Daily Market Brief

Users open AlphaBrief each morning to find an AI-generated market overview at the top of the home page — the daily anchor that delivers UJ-1 (Nam's morning brief journey) and drives return visits.

### Story 4.1: Daily Brief Schema & API Endpoint

As a developer,
I want the `DailyBrief` Pydantic schema defined and a `GET /api/daily-brief` endpoint that returns today's brief or yesterday's fallback,
So that the frontend always has valid brief data to display regardless of generation timing.

**Acceptance Criteria:**

**Given** `DailyBrief` is defined in `backend/app/models/schemas.py`
**When** an instance is constructed
**Then** it contains: `overall_sentiment` (Literal["bullish", "bearish", "neutral"]), `key_developments` (list[str], 3–5 items), `opportunities` (list[str]), `risks` (list[str]), `generated_at` (AwareDatetime), `brief_date` (date), `is_fallback` (bool)
**And** no `alias=` fields — snake_case on both Python and TypeScript sides

**Given** `frontend/src/types/index.ts`
**When** the `DailyBrief` TypeScript type is defined
**Then** it mirrors the Pydantic schema exactly
**And** `overall_sentiment` is typed as `"bullish" | "bearish" | "neutral"` — not `string`
**And** `is_fallback` is `boolean` — the frontend uses this flag to render the fallback state, not to conditionally hide content

**Given** `GET /api/daily-brief` and today's brief has been generated
**When** called
**Then** it returns the current day's `DailyBrief` with `is_fallback: false`
**And** `generated_at` is timezone-aware UTC — the frontend converts to Bangkok time for display

**Given** `GET /api/daily-brief` and no brief exists yet for today (e.g., before 07:00 Bangkok time)
**When** called
**Then** it returns yesterday's brief with `is_fallback: true`
**And** the response body is a valid `DailyBrief` — not an error, not `null`

**Given** `GET /api/daily-brief` and no brief exists at all (first run, no history)
**When** called
**Then** it returns `HTTP 404`
**And** the frontend handles this with the same pending/unavailable card state as any other data error

**Given** the `fetch()` call in `src/lib/api.ts` for this endpoint
**When** it is implemented
**Then** it uses `next: { revalidate: 60 }` — consistent with the global ISR strategy

**Given** integration tests for `GET /api/daily-brief`
**When** they run
**Then** the fallback scenario is tested: when today's brief is absent, yesterday's is returned with `is_fallback: true`
**And** `overall_sentiment` in the response is always one of the three valid strings
**And** `generated_at` parses as a timezone-aware ISO 8601 string

---

### Story 4.2: DailyBriefCard Component

As a retail investor,
I want a two-zone Daily Brief card that gives me the market overview and key developments at a glance,
So that I understand the day's market narrative in under 30 seconds before reading individual articles.

**Acceptance Criteria:**

**Given** `DailyBriefCard` receives a `DailyBrief` with `is_fallback: false`
**When** it renders
**Then** Zone 1 (espresso header) shows: "AI Daily Brief" title + "ภาพรวมตลาด" (`aria-hidden="true"`) + `SentimentBadge` with `overall_sentiment` + today's `brief_date` in Bangkok date format
**And** Zone 2 (white body) shows: market overview text + numbered list of `key_developments` + footer with `generated_at` timestamp + inline disclaimer: *"AI-generated market summary for informational purposes only. Not investment advice."* (10px, neutral-text)

**Given** the inline disclaimer in Zone 2
**When** a developer inspects the component
**Then** the disclaimer is rendered as static text — not a link to `/about`, not a prop, not behind a conditional (FR-D05)
**And** the disclaimer is present whenever Zone 2 renders — it cannot be suppressed

**Given** `DailyBriefCard` receives a `DailyBrief` with `is_fallback: true`
**When** it renders
**Then** Zone 1 shows yesterday's date + a "Today's brief is being prepared" indicator
**And** Zone 2 shows yesterday's brief content with a date label confirming it is from yesterday
**And** the card renders without error or empty state — the experience feels unhurried, not broken (FR-D03)

**Given** the brief data is loading inside a `<Suspense>` boundary
**When** the skeleton renders
**Then** both zones show `animate-pulse linen` skeleton blocks — no spinner, no blank white area

**Given** `GET /api/daily-brief` returns an error
**When** `DailyBriefCard` renders
**Then** it shows: "Daily Brief unavailable · Last attempted [time]" — never an empty or silent card

**Given** component tests for `DailyBriefCard`
**When** they run
**Then** normal, fallback, loading, and error states each render correctly without throwing
**And** a test asserts the disclaimer text is present in the rendered output for both the normal and fallback states

---

### Story 4.3: Daily Brief Ingestion Webhook & n8n Scheduling

As the n8n orchestration system,
I want to push the AI-generated Daily Brief into AlphaBrief each morning via a webhook endpoint,
So that a fresh brief is available for users by the time they open the app after 07:00 Bangkok time.

**Acceptance Criteria:**

**Given** `POST /webhooks/daily-brief` receives a valid `DailyBrief` payload
**When** called for a date with no existing brief
**Then** it returns `HTTP 200` with `{"status": "created"}`
**And** `GET /api/daily-brief` now returns today's brief with `is_fallback: false`

**Given** `POST /webhooks/daily-brief` is called a second time for the same `brief_date`
**When** n8n retries or re-generates the brief
**Then** it returns `HTTP 200` with `{"status": "updated"}` — the brief is updated in place (upsert by `brief_date`), not duplicated
**And** only one `DailyBrief` record exists per calendar date

**Given** a payload with `overall_sentiment` outside `"bullish" | "bearish" | "neutral"`
**When** the endpoint receives it
**Then** it returns `HTTP 422` — sentiment type safety enforced at the boundary

**Given** a payload with a timezone-naive `generated_at`
**When** the endpoint receives it
**Then** it returns `HTTP 422` — timezone-aware datetime required (NFR-D03)

**Given** the n8n workflow for Daily Brief generation
**When** it is configured
**Then** it triggers at 07:00 Bangkok time (UTC+7) each day (FR-D04)
**And** the trigger time is configurable without a code deploy
**And** the webhook URL is stored in an n8n environment variable — never hardcoded

**Given** integration tests for `POST /webhooks/daily-brief`
**When** they run
**Then** idempotency is verified: submitting the same `brief_date` twice results in one record with the most recent data
**And** the fallback behavior is confirmed: before the webhook fires, `GET /api/daily-brief` returns yesterday's brief with `is_fallback: true`

---

### Story 4.4: Home Page Integration — DailyBriefCard as Primary Entry Point

As a retail investor,
I want the Daily Brief to appear at the top of the page when I open AlphaBrief,
So that I am oriented to the market the moment the page loads — before I read any individual articles.

**Acceptance Criteria:**

**Given** the home page `/` on desktop (≥ 1024px)
**When** it renders
**Then** `DailyBriefCard` appears at the top of the right sidebar column, visible above the fold without scrolling (FR-D02)
**And** it replaces the sidebar placeholder card added in Story 2.8

**Given** the home page `/` on mobile (< 1024px)
**When** it renders
**Then** `DailyBriefCard` is the first content element after the Navbar and Ticker Bar — it appears above the news feed (FR-D02)
**And** it scrolls away naturally as the user reads down — it does not stick or dominate

**Given** `DailyBriefCard` on the home page
**When** added to the layout
**Then** it is inside a `<Suspense fallback={<SkeletonCard />}>` boundary
**And** the `api.ts` call uses `next: { revalidate: 60 }` — consistent with the global ISR strategy

**Given** `GET /api/daily-brief` returns `HTTP 404` (no brief yet, first run)
**When** `DailyBriefCard` renders on the home page
**Then** it shows the error state: "Daily Brief unavailable · Last attempted [time]" — the page does not throw or render a blank sidebar slot

**Given** the home page after Epic 4 is complete
**When** reviewed against UJ-1 (Nam's morning brief journey)
**Then** `DailyBriefCard` is visible immediately on desktop without scrolling
**And** `overall_sentiment` badge is readable at a glance from the top of the page
**And** `key_developments` list is visible in Zone 2 without expanding or clicking

---

## Epic 3: News & AI Analysis Ingestion Pipeline

Real financial news flows into AlphaBrief automatically via n8n, and each article receives AI-generated analysis within 5 minutes — the platform transitions from mock data to a live, self-updating product.

### Story 3.1: News Ingestion Webhook Endpoint

As the n8n orchestration system,
I want to push ingested news articles into AlphaBrief via a FastAPI webhook endpoint,
So that news items appear in the feed automatically within 30 minutes of publication without manual intervention.

**Acceptance Criteria:**

**Given** `POST /webhooks/news-ingest` receives a valid payload
**When** n8n calls the endpoint
**Then** it returns `HTTP 200` with `{"event_id": "<generated-id>", "status": "created"}`
**And** the news item is stored and becomes available via `GET /api/news`

**Given** the same `source_url` is submitted a second time
**When** `POST /webhooks/news-ingest` is called again
**Then** it returns `HTTP 200` with `{"event_id": "<original-id>", "status": "duplicate"}` — no second record is created (FR-N04 URL deduplication)

**Given** two articles with different `source_url` values but identical `content` body
**When** both are submitted
**Then** only the first is stored — content hash deduplication prevents duplicates from different sources (FR-N04)

**Given** a payload missing any non-nullable field (`headline`, `source`, `source_url`, `published_at`, `category`, `content`)
**When** the endpoint receives it
**Then** it returns `HTTP 422` with a clear field-level validation error — never `HTTP 500`

**Given** a payload with a `category` value outside the 5 defined categories
**When** the endpoint receives it
**Then** it returns `HTTP 422` — freeform category strings are rejected at the boundary

**Given** a payload with a timezone-naive `published_at`
**When** the endpoint receives it
**Then** it returns `HTTP 422` — timezone-naive datetimes are rejected (NFR-D03)

**Given** n8n retries the same payload 3 times due to a transient network failure
**When** all three requests arrive
**Then** exactly one news item is stored — idempotency is guaranteed regardless of retry count (NFR-R01)

**Given** integration tests for `POST /webhooks/news-ingest`
**When** they run
**Then** idempotency is verified by asserting the record count before and after a duplicate submission
**And** the content hash dedup is tested with two payloads sharing identical `content` but different URLs

---

### Story 3.2: AI Analysis Delivery Webhook Endpoint

As the n8n/Claude pipeline,
I want to push AI-generated analysis for a news article into AlphaBrief via a FastAPI webhook endpoint,
So that analysis becomes available within 5 minutes of ingestion and the UI transitions from pending state to full insight.

**Acceptance Criteria:**

**Given** `POST /webhooks/ai-analysis` receives a valid payload with `news_id`, `summary`, `affected_sectors`, `affected_stocks`, `sentiment`, and `analysis_at`
**When** called with a `news_id` that exists
**Then** it returns `HTTP 200` with `{"status": "attached"}`
**And** `GET /api/news/{news_id}` now returns a fully populated `ai_analysis` object — no longer `null`

**Given** `POST /webhooks/ai-analysis` is called a second time for the same `news_id`
**When** n8n retries the delivery
**Then** it returns `HTTP 200` with `{"status": "updated"}` — the analysis is updated in place, not duplicated (idempotent upsert)

**Given** `POST /webhooks/ai-analysis` with a `news_id` that does not exist
**When** called
**Then** it returns `HTTP 404` — orphan analysis attachments are rejected

**Given** a payload with `sentiment` set to any value outside `"bullish" | "bearish" | "neutral"`
**When** the endpoint receives it
**Then** it returns `HTTP 422` — sentiment type safety is enforced at the webhook boundary (FR-A05)

**Given** a payload with a timezone-naive `analysis_at`
**When** the endpoint receives it
**Then** it returns `HTTP 422` — all analysis timestamps must be timezone-aware (NFR-D03)

**Given** integration tests for `POST /webhooks/ai-analysis`
**When** they run
**Then** upsert behavior is verified: submitting analysis twice for the same `news_id` results in one `ai_analysis` record, not two
**And** after a successful delivery, `GET /api/news/{news_id}` returns `ai_analysis` as a populated object, not `null`

---

### Story 3.3: AI System Prompt — Version-Controlled Constraints

As a developer,
I want the AI analysis system prompt committed to the repository as application code,
So that every change to AI behavior is tracked in git history, reviewed in PRs, and deployable without manual intervention in n8n.

**Acceptance Criteria:**

**Given** a system prompt file at `backend/app/ai/system_prompt.txt` (or as a constant in `backend/app/ai/prompts.py`)
**When** it is read
**Then** it explicitly constrains all four required behaviors: (1) no price predictions, (2) no specific security recommendations, (3) output sentiment must be exactly one of `bullish`, `bearish`, `neutral`, (4) every response must include the phrase "for informational purposes only and does not constitute investment advice"

**Given** the system prompt file
**When** a developer changes its content
**Then** the change appears in `git diff` and must be committed — it is not a runtime-editable string stored in a database or n8n environment (NFR-AI01)

**Given** a test in `tests/ai/test_system_prompt.py`
**When** it runs
**Then** it asserts the prompt file exists at the expected path
**And** it asserts all four constraint phrases are present in the prompt content
**And** the test fails immediately if the file is deleted or any constraint phrase is removed

**Given** `docs/ai-quality-checklist.md`
**When** it is created
**Then** it documents the manual spot-check process for NFR-AI02: select 20 random articles, verify sentiment classification, record the error rate, and flag any run where error rate ≥ 15% for prompt review before public launch

---

### Story 3.4: n8n Workflow Configuration & End-to-End Pipeline Validation

As a retail investor,
I want the platform to automatically collect and analyze news without any manual triggering,
So that fresh, AI-analyzed articles appear in the feed within 30 minutes of publication.

**Acceptance Criteria:**

**Given** the n8n news ingestion workflow
**When** it is configured
**Then** it runs every 30 minutes during 09:00–18:00 Bangkok time and every 2 hours outside market hours (FR-N01)
**And** the webhook URL for `POST /webhooks/news-ingest` is stored in an n8n environment variable — never hardcoded in the workflow definition

**Given** the n8n AI analysis workflow
**When** a new article is ingested
**Then** it triggers the Claude analysis pipeline within 5 minutes at p90 (FR-A02)
**And** the webhook URL for `POST /webhooks/ai-analysis` is stored in an n8n environment variable — never hardcoded

**Given** `docs/n8n-setup.md`
**When** it is created
**Then** it documents: workflow import/export instructions, all required environment variables (webhook URLs, Claude API key reference), the scheduling configuration, and how to rotate webhook UUIDs without a code deploy

**Given** an end-to-end validation test (manual or scripted)
**When** a test article is submitted to `POST /webhooks/news-ingest`
**Then** the article appears in `GET /api/news` within 60 seconds
**And** `GET /api/news/{id}` returns a non-null `ai_analysis` within 5 minutes
**And** the `sentiment` value is one of the three valid strings — not a freeform value from Claude

**Given** n8n retries a failed webhook delivery
**When** the retry reaches either webhook endpoint
**Then** the data state is identical to a single delivery — no duplicate records (NFR-R01, verified against live endpoints using the idempotency tests from Stories 3.1 and 3.2)

---

## Epic 2: Core News Feed & Reading Experience

Users can browse AI-analyzed financial news, filter by category, and read full article detail pages — the complete reading experience from landing page to article, on both desktop and mobile, with full WCAG 2.1 AA accessibility.

### Story 2.1: Pydantic Schemas & TypeScript Types for the News Domain

As a developer,
I want the complete `NewsItem` and `AIAnalysis` Pydantic schemas with all non-nullable fields and strict types defined and mirrored exactly in TypeScript,
So that every subsequent story has a trustworthy data contract at compile time and runtime.

**Acceptance Criteria:**

**Given** `backend/app/models/schemas.py`
**When** `NewsItem` is defined
**Then** it includes these non-nullable fields: `id` (str), `headline` (str), `source` (str), `source_url` (str), `published_at` (AwareDatetime), `category` (Literal of 5 categories), `content` (str)
**And** `ai_analysis` is typed `AIAnalysis | None` (nullable — analysis may not exist yet)

**Given** `AIAnalysis` is defined in `schemas.py`
**When** an instance is constructed
**Then** it includes: `summary` (str), `affected_sectors` (list[str]), `affected_stocks` (list[str]), `sentiment` (Literal["bullish", "bearish", "neutral"]), `analysis_at` (AwareDatetime)
**And** no `alias=` fields exist on any model — snake_case on both Python and TypeScript sides, never camelCase

**Given** `frontend/src/types/index.ts`
**When** `NewsItem` and `AIAnalysis` TypeScript types are defined
**Then** they mirror the Pydantic schemas exactly: field names, types, and nullability
**And** `sentiment` is typed as `"bullish" | "bearish" | "neutral"` — never plain `string`
**And** `ai_analysis` is `AIAnalysis | null` — not `AIAnalysis | undefined` and not `AIAnalysis?`

**Given** the category field in Pydantic
**When** a value outside the 5 defined categories is submitted
**Then** Pydantic raises `ValidationError` — freeform category strings are rejected at the schema boundary

**Given** schema tests in `tests/models/test_schemas.py`
**When** they run
**Then** all non-nullable field nullability constraints are verified
**And** the `AwareDatetime` enforcement test passes for both `published_at` and `analysis_at`
**And** `sentiment` rejects any value not in `{"bullish", "bearish", "neutral"}`

---

### Story 2.2: News API Endpoints

As a retail investor,
I want to retrieve a filtered, fresh list of financial news items and open individual articles via the API,
So that the frontend can display current news with all required fields enforced.

**Acceptance Criteria:**

**Given** `GET /api/news`
**When** called with no params
**Then** it returns a JSON array of `NewsItem` objects sorted by `published_at` descending
**And** no item older than 7 days is included (threshold controlled by `NEWS_RETENTION_DAYS` env var, defaulting to 7)
**And** `source` and `source_url` are non-null on every item

**Given** `GET /api/news?category=energy`
**When** called with a valid category value
**Then** it returns only items in that category
**And** an unrecognized category value returns `HTTP 422` with a clear validation message

**Given** `GET /api/news`
**When** called
**Then** the response includes a `last_updated` ISO timestamp (AwareDatetime, UTC) representing the most recent item's `published_at`
**And** the `fetch()` call in `src/lib/api.ts` uses `next: { revalidate: 60 }` — the same value used consistently for this endpoint across all callers

**Given** `GET /api/news/{id}` with a valid ID
**When** called
**Then** it returns a single `NewsItem` with `ai_analysis` either fully populated or `null` (never a partial object)
**And** `source`, `source_url`, `headline`, and `published_at` are never null

**Given** `GET /api/news/{id}` with a non-existent ID
**When** called
**Then** it returns `HTTP 404`

**Given** integration tests for both endpoints
**When** they run
**Then** all `published_at` and `analysis_at` values parse as timezone-aware ISO 8601 (contain `+00:00` or `Z`) — no timezone-naive strings reach the API response
**And** all `sentiment` values in `ai_analysis` are strictly one of the three allowed values
**And** `isFinite()` is applied before any numeric formatting in the frontend `api.ts` layer — `NaN` never reaches a component

---

### Story 2.3: Navbar, BottomTabBar & Layout Foundation

As a user,
I want a persistent navigation bar on desktop and a bottom tab bar on mobile with bilingual labels and a live clock,
So that I can switch between sections from any page with a single interaction.

**Acceptance Criteria:**

**Given** Inter font loaded via `next/font/google` in `src/app/layout.tsx`
**When** any page renders
**Then** the `--font-inter` CSS variable is applied to `<html>` and `font-family` resolves to Inter with system-ui fallback

**Given** the Navbar renders on desktop (≥ 1024px)
**When** the page loads
**Then** it is `56px` tall, espresso background, sticky with `z-50`
**And** it shows: AlphaBrief logo left → four nav tabs center (Home / News / Trends / About) → live Bangkok time clock + LIVE badge right
**And** the active tab has a `2px khaki (#D7C9B8) border-bottom` and khaki text
**And** each tab's Thai sub-label has `aria-hidden="true"` at 90% opacity — the English label is the accessible text

**Given** the BottomTabBar renders on mobile (< 1024px)
**When** the page loads
**Then** it is `56px` tall, espresso background, fixed at the bottom with `pb-safe` safe area inset
**And** four tabs render: Overview / News / Stocks / Trends, each ≥ 44×44px touch target
**And** the active tab shows khaki icon/text + `2px border-top khaki`; inactive tabs are white at 45% opacity

**Given** the desktop two-column layout at `lg:` breakpoint
**When** a content page renders
**Then** the main grid is `grid-cols-[1fr_340px]` with `20px` column gap and `px-4 py-5` page padding

**Given** a keyboard user tabs to any page
**When** they press Tab for the first time
**Then** the skip-to-content link is the first focusable element, becomes visible on focus, and moves focus to `<main>` when activated

**Given** all interactive elements in Navbar and BottomTabBar
**When** focused via keyboard
**Then** the focus ring is `box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #4A342A` (espresso double-ring, 12.5:1 contrast)

---

### Story 2.4: SentimentBadge & AIInsightBox Components

As a retail investor,
I want AI sentiment shown with both a color dot and a text label, and AI analysis in a visually distinct inset box,
So that I understand market sentiment at a glance regardless of color vision.

**Acceptance Criteria:**

**Given** `SentimentBadge` receives `sentiment: "bullish" | "bearish" | "neutral"`
**When** it renders
**Then** it shows a colored dot (`●`) AND a text label (`BULLISH` / `BEARISH` / `NEUTRAL`) — never color alone
**And** `aria-label="Market sentiment: bullish"` (or bearish/neutral) is on the badge element
**And** badge text uses `positive` (#15803d) / `negative` (#dc2626) / `neutral-text` (#6b6560) — all verified ≥ 4.5:1 against their respective badge backgrounds

**Given** `AIInsightBox` renders with loaded analysis
**When** it renders
**Then** it shows: linen background (`#F5F1EA`), `2px camel (#B2967D) left border`, `6px border-radius`, no visible label
**And** the container has `aria-label="AI market analysis"` for screen readers

**Given** `AIInsightBox` renders in pending state (`ai_analysis === null`)
**When** it renders
**Then** it shows "Analysis in progress" in `cocoa` (`#7D5A44`) at full opacity, `400` font-weight
**And** a small animated CSS dot renders alongside — when `prefers-reduced-motion: reduce` is active, the dot is static

**Given** `AIInsightBox` renders in stale state (`analysis_at` > 24 hours ago)
**When** it renders
**Then** an amber inline indicator appears: clock icon + "Analysis from [relative time]"
**And** the clock icon has `aria-hidden="true"` and the readable time description is visible text
**And** the indicator uses `staleness` token (`#d97706`)

**Given** component tests for `SentimentBadge` and `AIInsightBox`
**When** they run
**Then** all three sentiment states render the correct dot + label
**And** pending state uses `cocoa` at full opacity — no `camel` at reduced opacity anywhere
**And** stale state renders the amber indicator for `analysis_at` values > 24h ago

---

### Story 2.5: NewsCard Component

As a retail investor,
I want each news item to show headline, sentiment, AI insight, and stock impacts in a clear visual hierarchy,
So that I can decide in under 10 seconds whether an article is worth reading in full.

**Acceptance Criteria:**

**Given** a `NewsCard` with fully loaded data
**When** it renders
**Then** scan order top-to-bottom is: headline (15px, 700, espresso) + `SentimentBadge` top-right → `AIInsightBox` → stock impact badges row → khaki divider → footer (source name · relative time · category tag right-aligned)
**And** the card is wrapped in an `<article>` element
**And** the full card surface is a single clickable area navigating to `/news/[id]` — not just the headline text

**Given** stock impact badges with ticker `PTT` and direction `"positive"`
**When** they render
**Then** the badge shows `▲ PTT` with `▲` in `positive` (#15803d) color
**And** the badge element has `aria-label="PTT: rising"` — the arrow character is not announced by screen readers

**Given** a `NewsCard` with `ai_analysis: null`
**When** it renders
**Then** `AIInsightBox` shows the pending state
**And** the stock impact badges row and `SentimentBadge` are hidden
**And** the card remains fully clickable with headline, source, and timestamp visible

**Given** a featured `NewsCard`
**When** it renders
**Then** it has `border-left: 3px solid #B2967D` (camel) applied to the card container

**Given** `NewsCard` tests covering edge-case data shapes
**When** they run with `null ai_analysis`, empty `affected_stocks`, and a `null source_url`
**Then** the card renders without throwing
**And** a null `source_url` renders the source name as plain text — no broken link element

---

### Story 2.6: News Feed Page & Category Filter Bar

As a retail investor,
I want to browse and filter news by category with clear loading, staleness, and error feedback,
So that I always know whether the content I see is current and can find articles relevant to my interests.

**Acceptance Criteria:**

**Given** the `/news` page loads
**When** it renders
**Then** the Category Filter Bar appears above the feed with "All" selected by default
**And** news items are sorted by `published_at` descending, each rendered as a `NewsCard`

**Given** the Category Filter Bar
**When** it renders
**Then** the container has `role="tablist"`, each tab has `role="tab"` + `aria-selected="true/false"`
**And** left/right arrow keys move focus between tabs without leaving the tab group
**And** each tab is at least `44px` tall

**Given** the user activates the "Energy" tab
**When** the tab is clicked or activated via Enter/Space
**Then** the URL updates to `/news?category=energy`
**And** the feed updates in place to show only Energy articles
**And** navigating back restores the "Energy" filter from the URL param

**Given** the most recent Energy article is > 60 minutes old during 09:00–18:00 Bangkok time
**When** the feed renders
**Then** an amber banner appears above the feed: "Last updated [time] · New articles may be delayed"
**And** the banner uses `staleness` color (`#d97706`)

**Given** all async data-fetching components on `/news`
**When** the page loads
**Then** each is wrapped in `<Suspense fallback={<SkeletonCard />}>` — skeleton shows `animate-pulse linen` blocks, no spinner, no "Loading..." text

**Given** the news API returns an error for the Energy category
**When** the feed renders
**Then** only Energy shows "Market data temporarily unavailable · Last attempted [time]" — other categories render normally
**And** no empty list or silent blank space is shown

**Given** a category with no articles
**When** the feed renders
**Then** it shows: "No new articles in [Category] today. · Check back during market hours (09:00–18:00 Bangkok time)."
**And** it is never an empty `<ul>` or blank space

**Given** the Search input
**When** it renders
**Then** it has `aria-label="Search news, stocks, and sectors"` (never placeholder-only)
**And** the espresso double-ring focus indicator is visible on focus

---

### Story 2.7: News Detail Page

As a retail investor,
I want to read the full AI impact analysis with source attribution and a compliance disclaimer,
So that I understand why a news event matters and can verify the original source before acting.

**Acceptance Criteria:**

**Given** `/news/[id]` loads with a valid ID
**When** the page renders
**Then** content appears in this order: (1) headline → (2) source name (non-nullable visible text) + external link to original article (non-nullable) + publication timestamp in Bangkok time → (3) full AI impact analysis → (4) affected sectors list → (5) affected stocks/indices with direction badges (each `aria-label="[SYMBOL]: rising/falling/unchanged"`) → (6) `SentimentBadge` → (7) analysis timestamp + amber staleness indicator if `analysis_at` > 24h → (8) non-removable disclaimer

**Given** the external source link
**When** it renders
**Then** it opens in a new tab (`target="_blank" rel="noopener noreferrer"`) with a visible external-link icon

**Given** `/news/[id]` with a non-existent ID
**When** the page renders
**Then** it shows "Article not found." with a back-navigation link to `/news` — never a raw Next.js error page

**Given** an article with `ai_analysis: null`
**When** the detail page renders
**Then** the AI section shows `AIInsightBox` in pending state
**And** headline, source name, source link, and timestamp remain visible and accessible

**Given** a permanent AI analysis failure
**When** the detail page renders
**Then** "Analysis unavailable for this article." appears in `neutral-text`
**And** the source link and headline remain fully accessible

**Given** a cold-load with no ISR cache
**When** the page renders
**Then** `<Suspense fallback>` skeleton blocks cover content areas — no blank white regions

**Given** the non-removable disclaimer (FR-A04)
**When** a developer inspects the component tree
**Then** the disclaimer string is a structural part of the component — not a prop, not behind a feature flag, not conditionally rendered

---

### Story 2.8: Home Page Layout & ISR Configuration

As a retail investor,
I want the home page to load quickly with server-rendered content and the correct two-column layout ready for subsequent epics' widgets,
So that my morning session starts immediately with fresh news.

**Acceptance Criteria:**

**Given** the home page `/` on desktop (≥ 1024px)
**When** it renders
**Then** the layout is: Navbar (sticky top) → Ticker Bar slot (below navbar) → two-column grid (left: page header + search + news feed; right: sidebar column with placeholder cards for unreleased widgets)
**And** placeholder sidebar cards do not throw errors — they render empty/skeleton state gracefully

**Given** the news feed data fetch on the home page
**When** it is implemented
**Then** `src/lib/api.ts` uses `next: { revalidate: 60 }` for the news endpoint — the same value used in Stories 2.2 and 2.6 (consistent revalidation prevents undefined cache behavior)

**Given** every async Server Component on the home page
**When** it is present
**Then** it is wrapped in `<Suspense fallback={<SkeletonCard />}>` — no missing boundaries

**Given** the home page measured with Lighthouse on a broadband connection
**When** LCP is measured
**Then** LCP is under 2.5 seconds — all primary content renders server-side via Server Components with no client-side data fetching on initial load

---

### Story 2.9: About / Disclaimer Page & WCAG Accessibility Audit

As a retail investor,
I want a clear disclaimer page and a fully accessible interface throughout the app,
So that I understand the product's limitations and can use it regardless of my assistive technology.

**Acceptance Criteria:**

**Given** the `/about` page
**When** it renders
**Then** it contains all five NFR-C02 required sections: (1) product description and scope, (2) AI analysis limitations, (3) data sources used, (4) no investment advice statement, (5) full regulatory disclaimer
**And** it is reachable from the Navbar "About" tab and BottomTabBar

**Given** all interactive elements across every page delivered in Epic 2
**When** audited for keyboard focus
**Then** every element shows the espresso double-ring focus indicator: `box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #4A342A`
**And** no element uses `camel` at reduced opacity as a focus style

**Given** the global stylesheet
**When** reviewed
**Then** it contains `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } }` covering card hover transitions, nav tab transitions, skeleton pulse, and the `AIInsightBox` animated dot

**Given** all pages rendered in Epic 2
**When** audited for landmark roles
**Then** `<header>`, `<nav>`, `<main>`, and `<footer>` are present on every page
**And** `AIInsightBox` has `aria-label="AI market analysis"` on every rendering surface

**Given** all AI-analysis-rendering surfaces after Epic 2 is complete
**When** the disclaimer requirement (FR-A04, NFR-C01) is verified
**Then** the disclaimer appears on the News Detail page and the About page as a structural part of each component — not a prop, not behind a conditional

---

## Epic 1: Development Foundation & Quality Infrastructure

Establish testing infrastructure and validate the existing codebase so every subsequent story can be built and verified with confidence. The development team has working test suites for both frontend and backend before any feature work begins.

### Story 1.1: Backend Testing Infrastructure

As a developer,
I want a fully configured backend test suite with proper async FastAPI testing patterns,
So that every backend story can be verified without fighting framework setup.

**Acceptance Criteria:**

**Given** `pytest`, `pytest-asyncio`, and `httpx` are added to `backend/requirements.txt`
**When** `pytest` runs from `backend/`
**Then** all tests pass with `asyncio_mode = "auto"` in `pyproject.toml` (no per-test `@pytest.mark.asyncio` needed)

**Given** `tests/conftest.py` uses the exact client pattern:
```python
client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
```
**When** a test sends `GET /api/news` via this client
**Then** the response is `HTTP 200` with a list of objects matching the `NewsItem` schema shape

**Given** `backend/app/models/schemas.py` defines `NewsItem` with `published_at: AwareDatetime`
**When** a `NewsItem` is constructed with a timezone-naive datetime
**Then** Pydantic raises a `ValidationError` — timezone-aware datetimes are enforced

**Given** all Pydantic model tests in `tests/models/test_schemas.py`
**When** `NewsItem`, `AIAnalysis`, and any other existing schemas are instantiated with valid fixture data
**Then** all non-nullable fields raise `ValidationError` when set to `None`

**Given** the three existing routers (`news`, `market`, `trends`)
**When** integration tests in `tests/routers/` run for each router
**Then** each router returns `HTTP 200` with a response whose fields match the declared `response_model`
**And** no `null` values appear for non-nullable fields in any integration test response
**And** line coverage on `app/models/` and `app/services/` is ≥ 80%

---

### Story 1.2: Frontend Testing Infrastructure

As a developer,
I want a fully configured frontend test suite with Vitest and React Testing Library,
So that every frontend component and API boundary story can be verified reliably.

**Acceptance Criteria:**

**Given** `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, and `@vitest/coverage-v8` are installed
**When** `npm run test` runs in `frontend/`
**Then** all tests pass without path resolution errors

**Given** `vitest.config.ts` configures `'@': path.resolve(__dirname, './src')`
**When** a test file uses `import { api } from '@/lib/api'`
**Then** the import resolves correctly (tsconfig path aliases do not auto-apply to Vitest — this must be explicit)

**Given** at least one test per existing component in `frontend/src/components/`
**When** each component is rendered with valid props matching its TypeScript type
**Then** the component renders without throwing and produces the expected DOM structure

**Given** `frontend/src/lib/api.ts` is mocked with `vi.mock('@/lib/api')`
**When** components that call API methods are tested with both resolved and rejected mock states
**Then** components render their loading/error states correctly and no unhandled promise rejections occur

**Given** `@vitest/coverage-v8` is configured with `lines: 80` floor
**When** `npm run test:coverage` runs
**Then** the report shows ≥ 80% line coverage on `src/lib/` and `src/components/`
**And** the CI script exits non-zero if coverage falls below the floor
