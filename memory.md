# FESTIVALMINT AI — Project Memory & Engineering Source of Truth

> **Last Updated:** 2026-11-12 13:20 PKT  
> **Active Sprint:** Sprint 6 Complete → Sprint 7 (QA, Security & Responsive Polish)  
> **Project Status:** Autonomous Execution (Sprints 2–8)  

---

## 1. Product Identity & Core Vision
- **Product Name:** FESTIVALMINT AI
- **Tagline:** *Great university events deserve the right sponsors.* (Also public umbrella: *Great events deserve the right sponsors.*)
- **Mission:** Connect university societies, student organizers, and community events with relevant corporate sponsors using explainable AI—covering event brief structuring, AI sponsorship package generation, deterministic + AI-explained sponsor matching, in-app sponsorship proposals, real PayPal Sandbox checkout & verified webhooks, and post-event deliverable evidence & AI performance reporting.
- **Core Differentiator:** A complete two-sided sponsorship lifecycle marketplace with transparent, deterministic factor scoring + AI explanation and verified post-event fulfillment—**not** a generic chatbot or static directory.

### Canonical 9-Step Product Journey
1. Organizer registers, chooses `organizer` role, and sets up society/university profile.
2. Organizer creates a university event (audience, dates, reach, needs, benefits).
3. AI structures and proposes Bronze/Silver/Gold (or custom) sponsorship packages with pricing rationale and explicit assumptions; organizer edits and saves.
4. Sponsor registers, chooses `sponsor` role, and creates a company brand profile (industry, target audience, marketing objectives, budget min/max, preferred categories/locations).
5. Sponsor discovers approved/published events (and organizer views recommended sponsors); deterministic scoring + AI generates transparent match scores (0–100) and plain-language compatibility explanations.
6. Organizer sends a tailored sponsorship proposal (optionally drafted with AI outreach assistant); sponsor reviews and accepts/rejects/requests changes.
7. Sponsor completes a real **PayPal Sandbox** checkout (`Orders v2` create -> browser approval -> server-side capture -> verified webhook reconciliation).
8. Organizer records deliverable fulfillment and uploads supporting evidence (photos, links, attendance exports/counts) to private storage.
9. AI analyzes submitted evidence vs. agreed deliverables and generates an evidence-grounded Sponsorship Performance Report separating verified facts, organizer claims, AI observations, and missing deliverables.

*(Plus Role C: **University Admin** — seeded server-side, never via public sign-up — moderates/verifies organizers and events and maintains audit logs.)*

---

## 2. Non-Negotiable Engineering Rules & Guardrails
1. **Stack Lock:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn-style UI + Supabase (PostgreSQL, Auth, Storage, RLS) + Gemini/OpenAI structured JSON + `@paypal/paypal-server-sdk` (Sandbox Orders v2 + webhook verification). **NO Spring Boot / Java.**
2. **Payment Integrity:**
   - Never trust payment amount, currency, role, or payment success from the browser.
   - Always load accepted proposal amount/currency from PostgreSQL on the server before calling PayPal.
   - Never mark a proposal/payment `paid`/`COMPLETED` based only on a frontend redirect.
   - Standard PayPal Sandbox merchant checkout only in MVP—do **NOT** claim multi-party split payouts or escrow.
   - Verify PayPal webhook signatures via PayPal's documented verification API and handle events idempotently via `webhook_events.paypal_event_id`.
3. **APIMatic Mandate:**
   - Use the **APIMatic PayPal Server SDK Context Plugin** (`npx context-plugins install paypal` / `https://github.com/paypaldev/server-sdk-context-plugin-preview`) during Sprint 5 PayPal SDK implementation.
   - Document accurately as a **development-time tooling assistant**, never as a runtime dependency.
4. **AI Integrity & Prompt-Injection Defense:**
   - Use structured JSON validated by Zod schemas; reject malformed outputs and never accept SQL/HTML.
   - Match scores are **computed deterministically in TypeScript**; LLM only produces plain-language explanations grounded in factor scores and stored fields.
   - Treat event descriptions, sponsor bios, and uploaded files as untrusted data, never system instructions.
   - Clearly label AI pricing suggestions and attendance estimates; never fabricate audience stats, visual proof, or completed deliverables without evidence.
   - Never allow AI to approve, initiate, capture, or modify payments.
5. **Security & Privacy:**
   - Keep `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` / `OPENAI_API_KEY`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_WEBHOOK_ID` strictly server-side.
   - Enforce BOTH Supabase Row Level Security (RLS) AND Next.js server-side role/ownership checks.
   - Keep evidence files in a private Supabase Storage bucket with MIME/extension/size validation and short-lived signed URLs.
   - Never commit `.env*` secret files or personal data. Label all demo accounts and seeded organizations clearly as fictional demo data.

---

## 3. Design System & Visual Identity Memory
- **Theme Tone:** Precision University-Tech SaaS & B2B Marketplace (clean editorial clarity + financial-grade trust).
- **Color Tokens:**
  - Primary Ink / Brand Dark: `#0B1220` (deep obsidian navy), `#0F172A` (slate-900)
  - Primary Accent (Festival Mint): `#10B981` (emerald-500) / `#059669` (emerald-600) with subtle surface tint `#ECFDF5`
  - Canvas & Surfaces: `#F8FAFC` (crisp cool porcelain background), `#FFFFFF` (elevated cards), `#E2E8F0` (1px structural hairlines)
  - Text Hierarchy: `#0F172A` (primary), `#475569` (secondary), `#64748B` (muted)
  - Semantic States: Amber `#D97706` (pending/review), Crimson `#DC2626` (error/rejected), Blue `#2563EB` (info/verified)
- **Typography:**
  - Display & UI Sans: `Plus Jakarta Sans` (headings/brand) & `Inter` (body) via `next/font/google`
  - Technical Monospace: `JetBrains Mono` for monetary amounts, match factor breakdowns, PayPal Order/Capture IDs, and status codes
- **Layout Standards:**
  - Public Marketing: Sticky minimal header, crisp hero with 2-sided value proposition + interactive workflow visual, clear dual CTAs (`For Organizers` / `For Sponsors`), featured verified demo events.
  - Dashboards: Responsive left sidebar (`240px`) on desktop + compact mobile header & bottom/drawer navigation usable cleanly at `375px` width with zero horizontal overflow.
  - Real States Only: Skeleton loaders, meaningful empty states, inline Zod validation errors, explicit confirmation dialogs, no fake charts or decorative filler.

---

## 4. Environment & Verified Tooling Snapshot
- **Workspace:** `f:\paypal hackathon`
- **Source Spec:** `FESTIVALMINT_AI_Execution_Plan_and_Agent_Handoff.docx` (preserved in root)
- **Verified Local Runtimes (2026-11-12 12:31 PKT):**
  - Node.js `v24.18.1`
  - npm `11.16.0` / npx `11.16.0`
  - pnpm installed
  - Git `2.55.0.windows.3` (repository initialized in Sprint 1)
  - PostgreSQL client `psql` 18 & Docker Desktop binary present
  - `gh`, `supabase`, `vercel` not globally installed (can invoke via `npx` if needed)
- **APIMatic Context Plugins CLI:** `context-plugins@0.12.0` verified (`paypal` plugin available in marketplace + preview repo `paypaldev/server-sdk-context-plugin-preview`).
- **PayPal Server SDK:** `@paypal/paypal-server-sdk@2.5.0` verified on npm.
- **External Credentials Status (Pending User Configuration in `.env.local`):**
  - `NEXT_PUBLIC_SUPABASE_URL` — Not yet provided
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Not yet provided
  - `SUPABASE_SERVICE_ROLE_KEY` — Not yet provided
  - `GEMINI_API_KEY` / `OPENAI_API_KEY` — Not yet provided
  - `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_WEBHOOK_ID` — Not yet provided

---

## 5. Timeline Strategy: 48-Hour Sprint Structure + Submission Reality Check
- **Framework:** 8 sequential 6-hour Sprint Blocks (Sprint 1: Hours 0–6 through Sprint 8: Hours 42–48) with mandatory checkpoints and quality gates.
- **Deadline Reality Check (from Execution Plan DOCX Section 13):**
  - Brief notes hackathon deadline `2026-11-13 01:00 PKT` (~12.5 hours from `2026-11-12 12:31 PKT`).
  - **Execution Rule:** Maintain full 8-Sprint discipline while compressing P0 vertical slices first so every sprint leaves a deployable, testable application. If time becomes tight, cut P2 items in strict order: (1) PWA, (2) Email notifications, (3) Admin analytics charts, (4) Automated CV logo detection, (5) PayPal Invoicing API. **NEVER cut** Auth/RBAC, Event/Sponsor flows, AI packages/matching, PayPal server-side create+capture, APIMatic usage, or README/demo readiness.

---

## 6. Architecture & Decision Log
| Date | Decision | Rationale |
|---|---|---|
| 2026-11-12 | Scaffold Next.js App Router + TypeScript + Tailwind CSS (no `src/` directory) | Aligns with Execution Plan repo map (`app/`, `components/`, `lib/`, `types/`, `supabase/`, `tests/`). |
| 2026-11-12 | Store all currency amounts as integer minor units (`price_minor`, `amount_minor`) + ISO `currency` | Eliminates floating-point rounding bugs in sponsorship quotes and PayPal Orders v2 reconciliation. |
| 2026-11-12 | Deterministic TypeScript scoring engine + LLM plain-language explanation | Prevents hallucinated match percentages and ensures reproducible, inspectable 0–100 breakdowns. |
| 2026-11-12 | Implement graceful startup when `.env.local` keys are absent + clear configuration banner | Keeps app runnable/buildable at every checkpoint even before Supabase/PayPal/AI keys are added. |

---

## 7. Sprint Checkpoint Log
- **Sprint 1 (Hours 0–6):** **COMPLETE (Gate 1 Passed)** — Initialized Next.js 16.4.6 App Router + TypeScript + Tailwind CSS v4 foundation, design system, responsive `SiteHeader`/`DashboardShell`, landing page (`/`), `proxy.ts` session guard, Supabase SSR/Admin helpers, 17-table schema + RLS/anti-escalation triggers + fictional demo seed SQL, `.env.example`, and `/api/health`. Verified `tsc --noEmit`, `eslint`, `next build`, and production HTTP route smoke checks. (`480f9fa`)
- **Sprint 2 (Hours 6–12):** **COMPLETE (Gate 2 Passed)** — Implemented Supabase Auth (`/auth/sign-in`, `/auth/sign-up`, `/auth/callback`, `/api/auth/*`), role-locked onboarding (`organizer`/`sponsor`, rejecting `admin`), server session & RBAC guards (`lib/auth/session.ts`), real DB-backed Organizer/Sponsor/Admin dashboards, `/settings/profile`, Admin moderation routes (`/api/admin/review`, `/api/admin/users`) + `audit_logs`, `scripts/seed-demo.mjs`, and `tests/sprint2-auth.test.ts` (5/5 pass). (`259a3f7`)
- **Sprint 3 (Hours 12–18):** **COMPLETE (Gate 3 Passed)** — Implemented event CRUD (`/api/events`, `/api/events/mine`, `/api/events/[id]`, `/api/events/[id]/submit`), `/organizer/events/new`, `/organizer/events/[id]`, structured AI package generation (`POST /api/ai/packages`, `lib/ai/client.ts`, `lib/ai/packages.ts`) with Zod validation and clearly labeled deterministic fallback, editable `PackageStudio` UI, package persistence (`PUT /api/events/[id]/packages`), and `tests/sprint3-events-packages.test.ts` (8/8 suite pass, 34 routes built). (`9894693`)
- **Sprint 4 (Hours 18–24):** **COMPLETE (Gate 4 Passed)** — Implemented approved-event discovery (`/sponsor/discover`, `GET /api/events/discover`), event detail + package selection (`/sponsor/events/[id]`), deterministic 6-factor scoring engine (`lib/matching/scorer.ts`) + AI explanation/outreach layers (`lib/ai/matching.ts`, `POST /api/ai/matches`, `POST /api/ai/outreach`) with `ai_provider` vs `deterministic_fallback` provenance, organizer matches (`/organizer/matches`), proposal workflow (`/organizer/proposals`, `/sponsor/proposals`, `POST /api/proposals`, `PATCH /api/proposals/[id]/respond`, migration `0003_sponsor_proposals.sql`), and `tests/sprint4-matching.test.ts` (11/11 suite pass, 36 routes built). (`8efd366`)
- **Sprint 5 (Hours 24–30):** **COMPLETE (Gate 5 Passed)** — Installed APIMatic `paypal` context plugin (`npx context-plugins install paypal --yes --targets vscode,cursor`), installed `@paypal/paypal-server-sdk@2.5.0` & `@paypal/react-paypal-js`, built `lib/paypal/client.ts` & `lib/paypal/guards.ts`, Orders v2 `POST /api/paypal/orders` (server-side DB amount/currency lookup only) + `POST /api/paypal/capture` (verifies `COMPLETED` & amount/currency, writes `payments`, marks proposal `paid`, seeds `deliverables`), idempotent verified `POST /api/paypal/webhook` (`/v1/notifications/verify-webhook-signature` + `webhook_events.paypal_event_id`), `/sponsor/payments/[id]` checkout UI, and `tests/sprint5-paypal.test.ts` (15/15 suite pass, 37 routes built). (`e7bcbe1`)
- **Sprint 6 (Hours 30–36):** **COMPLETE (Gate 6 Passed)** — Created private Supabase Storage `evidence` bucket migration (`0004_storage_bucket.sql`), MIME/extension/10MB validator (`lib/validation/evidence.ts`), evidence upload + URL/notes fallback + sponsor deliverable review API (`POST`/`PATCH /api/evidence`), evidence-grounded AI Sponsorship Performance Report generator (`lib/ai/reports.ts`, `POST /api/ai/reports`), shared Organizer & Sponsor report views (`/organizer/reports/[id]`, `/sponsor/reports/[id]`), sanitized `.env.example` placeholders, and `tests/sprint6-evidence.test.ts` (18/18 suite pass, 39 routes built).
