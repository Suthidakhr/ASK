---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-AlphaBrief-2026-06-20/prd.md"
  - "_bmad-output/project-context.md"
workflowType: 'architecture'
project_name: 'AlphaBrief'
user_name: 'Suthidakhrueanak'
date: '2026-06-20'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:** 24 FRs across 5 domains

| Domain | FRs | Core Capability |
|---|---|---|
| News Aggregation (FR-N) | 6 | Scheduled ingestion, dedup, categorization, staleness |
| AI Impact Analysis (FR-A) | 7 | Per-article summary, sentiment, sectors/stocks, pending state |
| Market Trends (FR-T) | 4 | AI-grouped thematic clusters, auto-archiving |
| Daily Brief (FR-D) | 5 | Daily generated briefing, graceful fallback to prior day |
| Navigation & UX (FR-UX) | 7 | 4-section nav, category filtering, detail view, error states |

Architecturally, there are **three distinct write paths** (news ingestion → n8n, AI analysis → n8n→Claude, brief/themes → n8n scheduled) and **one read path** (Next.js → FastAPI → client). The two are decoupled — n8n pushes into FastAPI via webhooks, the frontend pulls via ISR.

**Non-Functional Requirements driving architecture:**

| NFR | Architectural Impact |
|---|---|
| LCP < 2.5s | ISR + Server Components; no client-side data fetching on initial load |
| 60s ISR refresh | All news fetch calls use `next: { revalidate: 60 }` — consistent across endpoints |
| AI pipeline p90 < 5 min | Pending state at API level; news visible before analysis completes |
| Idempotent webhooks | Payload hash or event ID dedup on every FastAPI POST endpoint n8n calls |
| WCAG 2.1 AA | Sentiment requires secondary non-color indicator (label or icon), not color alone |
| Disclaimer non-removable | Disclaimer must be a structural part of the component, not a prop/flag |
| Timezone-aware datetimes | `AwareDatetime` on all Pydantic fields; UTC storage, UTC+7 display |
| Source attribution non-nullable | `source` + `source_url` enforced as non-nullable in Pydantic, TypeScript, and UI |

**Scale & Complexity:**

- **Complexity level: Medium** — no auth, no real-time websockets, limited user interaction complexity, but meaningful compliance constraints and a multi-stage async pipeline
- **Primary domain:** Full-stack web (Next.js frontend, FastAPI backend, n8n orchestration)
- **Estimated architectural components:** 5 major (n8n Cloud, FastAPI, PostgreSQL-future/in-memory-now, Next.js App, Claude via n8n)

### Technical Constraints & Dependencies

1. **Stack is pre-decided** — Next.js 15 App Router, React 19, TypeScript strict, Tailwind v3, FastAPI, Pydantic v2, Python 3.13, httpx. No deviation without discussion.
2. **n8n is webhook-only** — no SDK, no bidirectional connection. All n8n → backend communication is HTTP POST to FastAPI endpoints.
3. **No database in MVP** — data is currently mock/in-memory. PostgreSQL is planned but not scoped. Architecture must accommodate this transition cleanly.
4. **ISR as the caching strategy** — 60s revalidate is the business contract. Real-time endpoints must be explicitly marked `force-dynamic` and documented as exceptions.
5. **n8n webhook UUID is a live credential** — must live in environment variable, rotatable without code deploy.
6. **Thai timezone** — Bangkok time (UTC+7) is the user-facing timezone. All stored datetimes must be UTC. Frontend converts for display.
7. **No user auth in MVP** — architecture must not assume session, identity, or user-scoped data at any layer.

### Cross-Cutting Concerns Identified

1. **Data freshness contract** — staleness indicators required at the feed level (60 min during market hours) and at the analysis level (24h). Must be enforced in Pydantic, API response shape, and every UI component that displays timestamps.
2. **Financial compliance** — AI disclaimer is a structural non-negotiable. Error states must be explicit and timestamped (never silent/empty). Color/direction consistency enforced at data layer.
3. **Schema sync discipline** — Pydantic ↔ TypeScript kept manually in sync. Snake_case on both sides. No `alias=` in Pydantic. Nullable in Pydantic → `T | null` in TypeScript (not `T?`).
4. **Sentiment type safety** — `"bullish" | "bearish" | "neutral"` enforced as a union at Pydantic, TypeScript, and UI layers. Free-form strings are a bug, not a feature.
5. **Idempotency** — every n8n-facing FastAPI endpoint must be idempotent. n8n retries on failure; duplicate inserts are a financial data integrity problem.
6. **AI pipeline isolation** — AI analysis failure or delay must not block news display. Pending state is a first-class rendering concern.
7. **Category-level resilience** — one failing category must not block other sections from rendering.
8. **Numeric safety** — `isFinite()` guard required before any `toFixed()` or `Math.abs()` on financial figures. `NaN` must never reach the DOM.

---

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web application** — existing codebase already initialized.

### Assessment: Project Already Bootstrapped

The AlphaBrief codebase is not a new project. Both the frontend and backend are already standing with meaningful code:

| Layer | Status | What exists |
|---|---|---|
| Frontend | Initialized + populated | Next.js 15 App Router, 4 pages, 9 components, `lib/api.ts`, `types/index.ts` |
| Backend | Initialized + populated | FastAPI, 3 routers (news/market/trends), schemas, mock_data service |

No new project initialization is needed. The "starter" decision was already made when the project was created with `create-next-app` + manual FastAPI scaffold.

### Established Foundation

**Frontend — `create-next-app` (Next.js 15)**

```bash
npx create-next-app@15.1.0 frontend \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
```

**Architectural decisions in place:**
- Language: TypeScript 5 strict mode
- Styling: Tailwind CSS 3.4.17 + `clsx` for conditional classes
- Routing: App Router (`src/app/`) — Pages Router explicitly excluded
- Path alias: `@/` → `src/`
- Build: Next.js default (SWC compiler, built-in optimization)
- Linting: ESLint via `eslint-config-next`

**Backend — Manual FastAPI scaffold**

```bash
pip install fastapi uvicorn httpx pydantic
```

**Architectural decisions in place:**
- Language: Python 3.13
- Framework: FastAPI 0.115.0
- Validation: Pydantic v2.9.2
- HTTP client: httpx (AsyncClient via lifespan)
- Structure: `routers/` → `services/` → `models/schemas.py` layering

**Testing infrastructure:** Not yet in place — to be added (Vitest + RTL for frontend; pytest + pytest-asyncio for backend).
