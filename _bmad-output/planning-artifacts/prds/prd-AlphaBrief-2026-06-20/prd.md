---
title: AlphaBrief — Product Requirements Document
status: draft
created: 2026-06-20
updated: 2026-06-20
---

# AlphaBrief — Product Requirements Document

**Version:** Draft 1.0
**Date:** 2026-06-20
**Stage:** Validation MVP
**Author:** Suthidakhrueanak

---

## 1. Problem Statement

### The Problem

Financial news is abundant but costly to process. Understanding which news matters — and what it means for specific stocks or sectors — requires domain expertise and time that most retail investors do not have. The result: investors either tune out the news entirely, or spend hours trying to piece together what it means before they can act.

This problem is acute for three types of people: beginners who lack the financial literacy to interpret news; working professionals who invest as a side activity and have 5–10 minutes at best; and active retail investors who follow multiple sectors but cannot read every article.

**Thai retail investors face a compounded version of this problem.** Most AI-powered financial tools are US-centric. SET (Stock Exchange of Thailand) coverage with AI-level analysis is virtually nonexistent in the market today.

### Why Now

AI has made per-article impact analysis, sentiment classification, and thematic grouping achievable at scale — without institutional budgets. Retail investors are increasingly self-directed but remain underserved by tools that are either too complex (Bloomberg), too US-centric (Seeking Alpha, MarketBeat), or too shallow (news apps with no impact layer). The technology gap has closed. The product gap has not.

---

## 2. Vision and Goals

### Product Vision

AlphaBrief is the fastest way for a retail investor to understand what is happening in the market and why it matters — without reading dozens of articles.

### What AlphaBrief Is

- A financial research and market intelligence platform
- A reading assistant that surfaces impact and meaning, not just headlines
- A daily briefing layer on top of financial news

### What AlphaBrief Is Not

- An investment advisory service
- A trading recommendation system
- A real-time trading or execution tool

### Validation-Phase Goals

1. Confirm that AI-powered impact analysis meaningfully reduces time-to-insight for retail investors
2. Confirm that a daily market brief is a compelling daily-use hook that drives return visits
3. Establish product quality and reliability sufficient to support a public launch decision

---

## 3. Target Users

### Primary Segment

Time-pressed retail investors — beginner to intermediate — who self-direct their investments but cannot commit significant time to financial news daily.

### Three Representative User Types

**Beginner investors**
Want to understand market movements without financial literacy overhead. Need plain-language explanations of why a news event matters. Risk: easily overwhelmed by jargon or excessive data.

**Working professionals**
Invest as a side activity. Have 5–10 minutes in the morning or evening to stay informed. Want a structured briefing, not a research session. Skip the day entirely if the tool takes effort to use.

**Active retail investors**
Follow specific sectors or individual stocks. Want impact analysis and sentiment tagging so they can prioritize which articles are worth reading in depth. Value coverage of Thai (SET) stocks alongside global markets.

### Market Focus

Thai market coverage (SET-listed stocks and Thai macroeconomic events) is a first-class concern, not an afterthought. Users in this segment have no comparable AI-powered alternative today.

---

## 4. User Journeys

### UJ-1 — Morning Brief (Working Professional)

**Protagonist:** Nam, 34, marketing manager in Bangkok. Invests in Thai tech stocks and US ETFs. Has 10 minutes over coffee before work.

Nam opens AlphaBrief on her desktop. The Daily Brief loads immediately at the top — three key market developments from overnight, an overall sentiment label (Bearish), and two highlighted risks. She reads the second item about Fed rate signals: a 3-sentence AI summary says short-term bond yields are likely to rise, with Banks rated negative and Technology rated neutral for impact. She scans the sentiment badges in the news feed below — mostly neutral, one bearish item in Energy she flags mentally. She closes the browser in 8 minutes. She has not read a single full article, but she feels informed enough to decide not to act today.

**What must work:** Daily Brief loads without waiting; sentiment is visually scannable at a glance; individual analysis is readable in under 30 seconds.

---

### UJ-2 — Impact Check (Beginner Investor)

**Protagonist:** Lek, 27, software engineer. Recently bought shares in a renewable energy ETF after hearing about global energy trends. Heard an OPEC announcement on the radio during his commute.

Lek opens AlphaBrief on his phone (mobile browser) and navigates to the Energy category. He finds the OPEC news item near the top, with a Bearish sentiment badge. He reads the AI impact summary: "OPEC's surprise production cut signals continued supply restriction. Short-term: upward pressure on oil prices, negative for energy-importing economies. Affected sectors: Energy (bearish short-term), Consumer Goods (bearish, rising input costs)." He does not fully understand what "energy-importing economy" means, but he understands the practical implication. He decides not to sell, based on the neutral long-term label. He closes the app in 4 minutes.

**What must work:** Category filtering surfaces the right article; AI summary is written in plain language without jargon; sentiment is immediately visible on the card; mobile layout is functional.

---

### UJ-3 — Sector Sweep (Active Retail Investor)

**Protagonist:** Wanida, 42, accountant. Actively manages a Thai stock portfolio. Wants to understand the technology sector before the SET opens Monday morning.

Wanida opens AlphaBrief on her desktop on Sunday evening. She navigates to the Trends view and finds an AI-identified theme: "AI Hardware Demand Cycle — 6 related articles." She expands it and reads two summaries. One item notes: "Affected Thai stocks: DELTA, HANA" — she makes a mental note to review her DELTA position. She checks the Technology category filter and sees 4 more articles from the past 48 hours, two of which are already covered by the theme. She spends 12 minutes instead of 45, with a clear sense of the narrative shaping the sector.

**What must work:** Themes correctly group related articles; Thai stock identifiers appear in impact analysis; switching between Trends and category filtering is smooth.

---

## 5. MVP Scope

### In Scope

| Capability | Description |
|---|---|
| News Aggregation | Collect and categorize financial news from trusted sources via n8n |
| AI Impact Analysis | Per-article AI summary, sector/stock impact, sentiment classification |
| Market Trends | AI-grouped thematic news clusters updated daily |
| Daily Brief | Daily market overview: sentiment, key developments, opportunities, risks |

**Supported categories:** Global Markets, Thai Stocks (SET), Technology, Energy, Macroeconomics

**Platform:** Responsive web application (Next.js); desktop-primary, mobile-responsive

**Language:** English (MVP)

### Out of Scope for MVP

- User accounts and authentication
- Personalized watchlists or portfolio tracking
- Portfolio impact analysis
- Native mobile apps (iOS / Android)
- Push notifications or email alerts
- AI chat assistant
- Automated report delivery
- Monetization or paywalls
- Thai-language UI

---

## 6. Feature Requirements

### 6.1 News Aggregation

**FR-N01** — The system shall collect financial news from a curated set of trusted sources via n8n workflows on a scheduled basis. Minimum frequency: every 30 minutes during market hours (09:00–18:00 Bangkok time); at least once every 2 hours outside market hours.

**FR-N02** — Each news item shall be stored with the following fields, all non-nullable: headline, source name, source URL, publication timestamp (timezone-aware), category tag, and raw content body. Source name and URL must survive the full pipeline to UI display.

**FR-N03** — News items shall be organized into exactly one primary category: Global Markets, Thai Stocks, Technology, Energy, or Macroeconomics.

**FR-N04** — The system shall deduplicate news items by URL and content hash. Duplicate articles from different sources shall not appear as separate items in the feed.

**FR-N05** — News items shall not appear in the main feed if their publication timestamp is older than 7 days. This threshold is configurable in the backend.

**FR-N06** — Every news feed view shall display a "Last updated" timestamp. If the most recent item in a category is older than 60 minutes during market hours, a visible staleness warning shall be displayed.

> [ASSUMPTION] News sources are RSS or API-based, configured within n8n workflows. The specific source list (e.g., Reuters, Bangkok Post, SET announcements, Bloomberg RSS) is a backlog item to be confirmed before development begins (see OQ-1).

---

### 6.2 AI Impact Analysis

**FR-A01** — For every news item, the AI pipeline shall generate: (a) a 2–4 sentence plain-language impact summary, (b) a list of 0–3 affected sectors using standardized labels, (c) a list of 0–5 affected stocks or indices using standard ticker symbols, (d) a sentiment classification — strictly one of: "bullish" | "bearish" | "neutral".

**FR-A02** — AI analysis shall be triggered automatically via n8n within 5 minutes of a news item being ingested (p90 target).

**FR-A03** — If AI analysis has not yet completed for a news item, the UI shall display the headline, source, and timestamp with an "Analysis pending" state. The article shall not be hidden or withheld from the user.

**FR-A04** — Every surface that renders AI-generated analysis must include the following disclaimer as a non-removable element: *"AI-generated analysis is for informational purposes only and does not constitute investment advice."* No prop, feature flag, or configuration may suppress this disclaimer. If analysis renders, the disclaimer renders.

**FR-A05** — Sentiment values shall be typed as the union "bullish" | "bearish" | "neutral" at every layer (Pydantic schema, TypeScript type, UI). Free-form string values are not acceptable.

**FR-A06** — The AI analysis timestamp shall be displayed alongside each analysis. If an analysis is older than 24 hours, a staleness indicator shall be shown.

**FR-A07** — AI analysis shall always display the source article headline and a link to the original article. Analysis shall never appear detached from its attributed source.

> [ASSUMPTION] The AI model used for impact analysis is Claude, called via n8n workflow. The system prompt — constraining output to summaries and explicit disclaimers, with no price predictions or security-specific recommendations — is a separate deliverable, version-controlled as application code.

> [ASSUMPTION] Thai stock ticker symbols follow SET conventions (e.g., DELTA, AOT, HANA). A reference list of supported Thai tickers to be used for stock impact tagging is a backlog item (see OQ-2).

---

### 6.3 Market Trends

**FR-T01** — The AI pipeline shall group related news items into named market themes on a scheduled basis. Each theme shall contain: a theme name (e.g., "AI Hardware Demand Cycle"), a 2–3 sentence description of the theme, a list of 2–8 constituent news items with individual analysis, and an overall theme sentiment.

**FR-T02** — The Trends view shall display all currently active themes as cards or sections, ordered by recency of the most recent constituent article.

**FR-T03** — Users shall be able to expand a theme card to see all constituent articles with their individual AI impact summaries and sentiment classifications.

**FR-T04** — Themes older than 48 hours with no new constituent articles shall be automatically archived and removed from the primary Trends view.

> [ASSUMPTION] Theme generation is triggered by a scheduled n8n workflow (proposed default: 07:00 Bangkok time daily). Real-time continuous theme generation is out of scope for MVP.

---

### 6.4 Daily Brief

**FR-D01** — The system shall generate one Daily Brief per calendar day. The brief shall contain: (a) overall market sentiment for the day (bullish / bearish / neutral), (b) 3–5 key market developments in plain language, (c) AI-identified notable opportunities, (d) AI-identified notable risks.

**FR-D02** — The Daily Brief shall be the primary entry point on the home page. It shall be rendered at the top of the page, always reflecting the current day's brief.

**FR-D03** — If the current day's brief has not yet been generated (e.g., before the scheduled generation time), the previous day's brief shall remain visible with a clear date label and a "Today's brief is being prepared" status indicator.

**FR-D04** — Daily Brief generation shall be triggered via n8n at a fixed daily time (proposed default: 07:00 Bangkok time / UTC+7). The trigger time is configurable.

**FR-D05** — The Daily Brief shall display its generation timestamp and include the disclaimer: *"AI-generated market summary for informational purposes only. Not investment advice."*

> [ASSUMPTION] The Daily Brief draws from news items and AI analysis generated in the preceding 24 hours. Handling for market holidays (e.g., no meaningful news) and weekends is a backlog item (see OQ-3).

---

### 6.5 Navigation and Information Architecture

**FR-UX01** — The application shall have a primary navigation with four sections: Home (Daily Brief), News (by category), Trends, and About / Disclaimer.

**FR-UX02** — The News view shall support filtering by the five defined categories. Default view shows all categories combined, sorted by publication time descending.

**FR-UX03** — Each news item in a list view shall display: headline, source name, publication time (relative format, e.g., "2 hours ago"), category tag, and AI sentiment badge (bullish / bearish / neutral with color coding).

**FR-UX04** — Sentiment and market direction color coding shall follow: green = positive / bullish, red = negative / bearish, gray = neutral. This mapping shall be enforced at the data layer — not as a CSS convention — to prevent color/direction mismatches on financial data.

**FR-UX05** — Clicking a news item shall open a detail view showing: headline, source name with link to original article, publication timestamp, AI impact summary, affected sectors (if any), affected stocks/indices (if any), sentiment classification, analysis timestamp, and disclaimer.

**FR-UX06** — All financial data displays shall surface data freshness. If a feed or analysis item has not been updated within the ISR window (60 seconds), a visible staleness state shall render.

**FR-UX07** — Error states shall never display empty or silent components. API failures and data-unavailable states shall render an explicit, timestamped "Data currently unavailable" message. An empty news feed must never be displayed without an explanation — a silent empty state can be misread as "no news = calm market."

---

## 7. Non-Functional Requirements

### Performance

**NFR-P01** — Largest Contentful Paint (LCP) on the home page shall be under 2.5 seconds on a standard broadband connection (desktop, Chrome).

**NFR-P02** — News feed content shall refresh via ISR within 60 seconds of new content being published to the backend.

**NFR-P03** — AI analysis pipeline (n8n → Claude → API) shall complete within 5 minutes of article ingestion at p90.

### Reliability

**NFR-R01** — All n8n webhook endpoints in FastAPI shall be idempotent. Duplicate webhook deliveries (n8n retry behavior) shall not produce duplicate records. Use payload hash or event ID for deduplication.

**NFR-R02** — The application shall degrade gracefully when the AI pipeline is delayed. News items shall remain accessible without analysis; "Analysis pending" state shall render, not an error.

**NFR-R03** — The application shall remain usable if any single data category (e.g., Thai Stocks feed) is unavailable, without blocking other sections.

### Data Integrity

**NFR-D01** — Source attribution (publisher name + original URL) must be non-nullable at every layer of the pipeline: n8n ingestion schema, Pydantic model, API response, and UI display.

**NFR-D02** — All numeric financial values shall include an `isFinite()` guard before display formatting. `NaN` values shall never be rendered to the DOM.

**NFR-D03** — All datetime fields from the API shall be timezone-aware (UTC). The frontend shall convert to Bangkok time (UTC+7) for display. Timezone-naive datetimes must not reach the UI layer.

### AI Output Standards

**NFR-AI01** — The AI system prompt defining analysis constraints (no price predictions, no specific security recommendations, mandatory disclaimer language) shall be version-controlled in the repository and treated as application code — not an editable runtime string.

**NFR-AI02** — A manual spot-check process for sentiment classification accuracy shall be established before public launch. Target: fewer than 15% incorrect sentiment tags on a random 20-item sample.

### Compliance

**NFR-C01** — Every component or page that renders AI-generated content must display the informational disclaimer. This requirement is non-negotiable and cannot be overridden by configuration.

**NFR-C02** — The product must clearly communicate its non-advisory positioning on the About / Disclaimer page, including: scope of AI analysis, data sources used, limitations of AI-generated content, and absence of regulatory authorization for investment advice.

### Accessibility

**NFR-ACC01** — The web application shall meet WCAG 2.1 AA standards for color contrast ratios. Sentiment color coding must meet contrast requirements even for color-blind users — a secondary indicator (label or icon) shall accompany color alone.

---

## 8. Success Metrics

### Validation-Phase Metrics

| Metric | Definition | Target |
|---|---|---|
| Time-to-insight | Average time for a test user to understand a news item's market impact using AlphaBrief vs. reading the source article | ≥ 40% reduction |
| Daily Brief return | % of test users who return the next day after viewing the Daily Brief | ≥ 50% D1 retention |
| Analysis pipeline reliability | % of ingested articles with AI analysis available within 5 minutes | ≥ 90% |
| Sentiment accuracy | Error rate on manual spot-check of 20 items | < 15% incorrect |
| Error state rate | % of page loads that render a data-unavailable error state | < 5% |

### Counter-Metrics (Watch for Negative Signals)

| Signal | Interpretation |
|---|---|
| Very low click-through to source articles | May indicate over-reliance on AI summaries — a trust or accuracy problem, not an engagement success |
| High "data unavailable" impression rate | Pipeline or source reliability failure |
| Users spending > 15 minutes per session | Suggests the product is not delivering its core promise of speed-to-insight |

---

## 9. Post-MVP Roadmap (Informational)

These capabilities are captured for directional context. None are in scope for this PRD.

| Feature | Description | Dependency |
|---|---|---|
| Personalized watchlists | Follow specific sectors, stocks, or themes | Requires user auth |
| Portfolio impact analysis | Map news events to user holdings | Requires watchlist + auth |
| AI chat assistant | Ask questions about market events and analysis | Requires AI chat pipeline |
| Automated daily/weekly reports | Email or in-app delivery via n8n scheduled workflows | Requires email infrastructure |
| Notification system | Alerts for market-moving events in followed sectors | Requires auth + push/email |
| Thai-language UI | Localized interface and Thai-language AI analysis | Requires i18n + prompt localization |
| User authentication | Accounts, saved preferences, reading history | Foundational for personalization features |

---

## 10. Open Questions

| # | Question | Priority | Condition to resolve |
|---|---|---|---|
| OQ-1 | Which specific news sources are included at launch? (Reuters, Bangkok Post, SET API, others?) | Must resolve before development | Source list drives n8n workflow design and data quality |
| OQ-2 | What is the supported SET ticker list for stock impact tagging? | Must resolve before AI pipeline | Needed to validate FR-A01 output |
| OQ-3 | How does the product handle market holidays and weekends? (No brief? Catch-up brief Monday?) | Should resolve before launch | Affects Daily Brief scheduling logic |
| OQ-4 | Is English the only language at launch, or is Thai-language analysis in scope earlier than currently planned? | Should resolve before UX work | Affects UI copy, AI prompt design, and IA |
| OQ-5 | Should the MVP require any form of user authentication, even for a read-only experience? | Should resolve before launch | Affects architecture and n8n integration scope |
| OQ-6 | What is the intended monetization model when the product goes public? (Freemium, subscription, ad-supported?) | Can defer — not MVP blocker | Informs pricing page and paywall architecture later |

---

*This document is a living artifact. Decisions made during development shall be recorded in `.decision-log.md` in this workspace.*
