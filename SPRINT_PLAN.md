# FESTIVALMINT AI — 48-Hour Aggressive Sprint Plan

> **Structure:** 8 sequential 6-hour Sprint Blocks (48-Hour Master Framework) with Accelerated Hackathon Compression targets mapped to **P0 → P1 → P2** priorities.  
> **Operating Loop per Sprint:** Plan → Implement → Test → Validate → Report → Gate Approval.

---

## Priority Classification

### P0 — Must Work (Non-Negotiable Core Path)
1. Next.js + TypeScript + Tailwind CSS + Supabase connection + deployment readiness.
2. Authentication (`organizer`, `sponsor`, server-seeded `admin`) with route protection & RLS.
3. Organizer profile + Event creation/editing/submission + Admin verification moderation.
4. Sponsor company profile + Approved event discovery + filters.
5. AI Sponsorship Package Generator (structured JSON + Zod validation + organizer edit/save).
6. Deterministic + AI-explained Sponsor/Event Matching (0–100 weighted factors + missing info).
7. Proposal lifecycle (create, send, accept/reject/request changes, audit timeline).
8. PayPal Sandbox Checkout (`@paypal/paypal-server-sdk` Orders v2 create + capture + server verification) assisted by APIMatic PayPal Context Plugin.
9. Public GitHub-ready repo, `.env.example`, migrations + seed SQL, `LICENSE`, `README.md`, 3-minute demo script & working deployed build.

### P1 — High-Impact Differentiators (Build Right After P0)
1. Verified PayPal Webhook receiver (`webhook_events` idempotency + signature verification).
2. AI Outreach / Proposal Draft Generator (editable before sending).
3. Organizer Deliverable Tracking + Evidence Upload (Supabase private Storage + signed URLs + URL/text fallback).
4. AI Sponsorship Performance Report (distinguishing verified evidence, organizer claims, AI analysis, and missing deliverables).
5. Seeded fictional demo dataset (1 university, 2 societies, 3 events, 4 sponsors with strong/weak match pairs) + demo accounts.
6. Mobile (`375px`) & Desktop UI polish across all product states.

### P2 — Defer / Cut First If Behind Schedule
- In-app notifications drawer (nice lightweight badge if fast; email notifications cut first).
- Saved/bookmarked events.
- Admin charts / advanced analytics.
- PDF proposal export.
- PayPal Invoicing API / PWA installation.

---

## 8-Sprint Execution Schedule

### Sprint 1 (Hours 0–6) — Project Inspection, Architecture & Foundation
- **Accelerated Target:** 45–60 min
- **Objective:** Establish a running Next.js App Router + TypeScript + Tailwind CSS application, cohesive design system, Supabase client/server plumbing, full relational SQL migrations + RLS + seed SQL, and engineering docs.
- **Tasks:**
  1. Complete repository inspection and document architecture/testing/sprint plans.
  2. Scaffold Next.js App Router + TypeScript + Tailwind + ESLint + Zod + Lucide icons.
  3. Configure `.env.example`, `.gitignore`, and fail-safe runtime environment loader (`lib/env.ts`).
  4. Build design tokens (`app/globals.css`), typography (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`), and reusable UI primitives (`components/ui/*`).
  5. Build public landing page (`/`), navigation header/footer, and placeholder/shell routes for `/auth/*`, `/onboarding`, `/organizer/*`, `/sponsor/*`, `/admin/*`.
  6. Author complete SQL migrations (`supabase/migrations/0001_initial_schema.sql`, `0002_rls_policies.sql`) and realistic demo `supabase/seed.sql`.
  7. Verify `tsc --noEmit`, ESLint, `npm run build`, and live local HTTP check; initialize Git and commit.
- **Gate 1 Acceptance Criteria:**
  - App compiles and starts cleanly locally (`200 OK` on `/`).
  - Environment template and Supabase client/server helpers exist without exposing secrets.
  - Complete normalized PostgreSQL schema + RLS migrations + seed SQL exist and are syntax-checked.
  - Navigation shell and core visual identity are in place.

---

### Sprint 2 (Hours 6–12) — Authentication, User Roles & Dashboards
- **Accelerated Target:** 60–90 min
- **Objective:** Working Supabase Auth, role-locked onboarding (`organizer` / `sponsor`), server-protected routes/APIs, seeded `admin` guard, and role dashboards + profile settings.
- **Tasks:**
  1. Implement `/auth/sign-up`, `/auth/sign-in`, `/auth/callback`, and sign-out action using `@supabase/ssr`.
  2. Enforce non-selectable `admin` role during public sign-up (`organizer` or `sponsor` only).
  3. Build `/onboarding` flow creating `profiles` + `organizer_profiles` (with university selection/creation) or `sponsor_profiles`.
  4. Implement Next.js middleware + server-side auth guards (`lib/auth/session.ts`) returning `401`/`403` cleanly.
  5. Build Organizer Dashboard (`/organizer/dashboard`), Sponsor Dashboard (`/sponsor/dashboard`), and Admin Dashboard/Review Queue (`/admin/dashboard`, `/admin/reviews`, `/admin/users`) + `/settings/profile`.
  6. Build Admin moderation API (`POST /api/admin/review`) with `audit_logs` entry.
- **Gate 2 Acceptance Criteria:**
  - Organizer, Sponsor, and Admin can log in and are routed to their respective dashboards.
  - Unauthorized cross-role requests (e.g. Sponsor calling Admin/Organizer APIs) return `403`.
  - Profile records persist in Supabase PostgreSQL across refresh and re-login.

---

### Sprint 3 (Hours 12–18) — Event Management & AI Sponsorship Packages
- **Accelerated Target:** 60–90 min
- **Objective:** Full organizer event CRUD, event submission for verification, and structured AI sponsorship package generator with organizer edit & save.
- **Tasks:**
  1. Build Zod schemas (`lib/validation/events.ts`, `lib/validation/packages.ts`).
  2. Implement Event APIs (`POST /api/events`, `GET /api/events/mine`, `PATCH /api/events/[id]`, `POST /api/events/[id]/submit`) with ownership & status transition guards.
  3. Build Organizer Event pages (`/organizer/events/new`, `/organizer/events/[id]`) including multi-select sponsorship needs, available benefits, target budget, and validation messages.
  4. Implement AI Provider abstraction (`lib/ai/client.ts` supporting Gemini/OpenAI with timeout, rate limit, prompt-injection sanitization, and Zod validation).
  5. Implement `POST /api/ai/packages` generating Bronze, Silver, Gold tiers with `suggested_price`, `benefits`, `availability`, `ideal_sponsor_categories`, `pricing_rationale`, `assumptions`, and `warnings`.
  6. Build interactive Package Editor UI allowing organizers to tweak prices/benefits/availability, approve, and save packages to `sponsorship_packages`.
- **Gate 3 Acceptance Criteria:**
  - Organizer can create, edit, and submit an event to PostgreSQL.
  - Invalid event data is rejected with clear field errors.
  - AI generates valid structured JSON packages (or clear error + editable fallback draft), and organizer edits persist in `sponsorship_packages`.

---

### Sprint 4 (Hours 18–24) — Sponsor Discovery & Explainable AI Matching
- **Accelerated Target:** 60–90 min
- **Objective:** Complete sponsor discovery of approved/published events, deterministic weighted matching engine, AI plain-language match explanations, and in-app proposal creation/response workflow.
- **Tasks:**
  1. Build Sponsor Discovery API (`GET /api/events/discover`) filtering strictly `status IN ('approved', 'published')` with category, budget, and keyword filters.
  2. Implement deterministic TypeScript scoring engine (`lib/matching/scorer.ts`):
     - Audience Fit (30%), Industry/Category Fit (20%), Budget Fit (20%), Location Fit (10%), Benefit Fit (10%), Timing Fit (10%), normalized 0–100 + confidence level + missing fields list.
  3. Implement `POST /api/ai/matches` combining deterministic factor scores with cached AI plain-language explanations (`matches` table) and recommended package selection.
  4. Build Sponsor Discovery UI (`/sponsor/discover`), Sponsor Event Detail & Package Comparison (`/sponsor/events/[id]`), and Organizer Matches View (`/organizer/matches`).
  5. Implement Proposal Workflow (`POST /api/proposals`, `PATCH /api/proposals/[id]/respond`, optional AI outreach draft `POST /api/ai/outreach`) with `proposal_events` timeline and `/organizer/proposals` + `/sponsor/proposals`.
- **Gate 4 Acceptance Criteria:**
  - Unapproved (`draft` / `pending_review`) events never appear in `/sponsor/discover`.
  - Seeded strong-fit sponsor consistently scores higher than poor-fit sponsor with transparent factor breakdown and missing-info disclosure.
  - Organizer can send a proposal; intended sponsor can accept/reject/request changes; non-owners get `403`.

---

### Sprint 5 (Hours 24–30) — PayPal Sandbox Integration & APIMatic Workflow
- **Accelerated Target:** 60–90 min
- **Objective:** Install and actively consult the APIMatic PayPal Context Plugin, then implement real server-side PayPal Orders v2 checkout, browser approval, server capture, and verified idempotent webhooks.
- **Tasks:**
  1. Install & verify APIMatic PayPal Context Plugin (`npx context-plugins install paypal` / official preview repo) and inspect current `@paypal/paypal-server-sdk` guidance; document usage notes in `ARCHITECTURE.md` & `README.md`.
  2. Install `@paypal/paypal-server-sdk` and `@paypal/react-paypal-js` (or official PayPal JS SDK loader).
  3. Implement `lib/paypal/client.ts` (server-only Sandbox client using `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`).
  4. Implement `POST /api/paypal/orders`: validate sponsor ownership + `proposal.status === 'accepted'`, load `amount_minor` & `currency` strictly from DB, create PayPal Order v2, store `payments` (`CREATED`) and transition proposal to `payment_pending`.
  5. Implement `POST /api/paypal/capture`: validate order ownership/proposal match, capture via PayPal Server SDK, verify capture status `COMPLETED`, update `payments` (`paypal_capture_id`, `captured_at`) and `proposals.status = 'paid'`, auto-seed `deliverables` from accepted package benefits.
  6. Implement `POST /api/paypal/webhook`: verify PayPal signature headers against `PAYPAL_WEBHOOK_ID`, check `webhook_events` for idempotency, reconcile `PAYMENT.CAPTURE.COMPLETED` / `DENIED` / `REFUNDED` safely.
  7. Build `/sponsor/payments/[id]` checkout screen with explicit sandbox notice, PayPal Buttons, clear success/cancel/failure states, and transaction receipt view.
- **Gate 5 Acceptance Criteria:**
  - Tampering with amount in client request has zero effect (server uses DB amount).
  - Real PayPal Sandbox order creates, approves, captures, and updates DB server-side.
  - Replaying the same webhook event ID does not duplicate records or corrupt state.

---

### Sprint 6 (Hours 30–36) — Sponsorship Fulfillment Evidence & AI Performance Reporting
- **Accelerated Target:** 45–60 min
- **Objective:** Close the post-payment loop with deliverable tracking, secure evidence uploads, and AI-generated evidence-grounded performance reports.
- **Tasks:**
  1. Configure private Supabase Storage bucket (`evidence`) with strict MIME (`image/png`, `image/jpeg`, `image/webp`, `application/pdf`, `text/csv`) and size limits (`10MB`), plus fallback URL/text submission.
  2. Implement `POST /api/evidence` (validating organizer ownership of paid proposal/deliverable, storing `evidence_files`, generating short-lived signed URLs).
  3. Build `/organizer/reports/[id]` deliverable checklist (`pending`, `submitted`, `verified`, `not_verified`, `waived_by_sponsor`) + evidence upload modal + sponsor read-only view.
  4. Implement `POST /api/ai/reports` generating structured performance report JSON (`performance_reports`) separating verified evidence, organizer claims, AI observations, attendance source labels, and missing/incomplete deliverables.
  5. Wire lightweight in-app `notifications` for proposal received, accepted, payment confirmed, and report published.
- **Gate 6 Acceptance Criteria:**
  - Unsupported file MIME/size is rejected cleanly (`400`).
  - Uploading partial evidence produces an AI report that explicitly flags missing/unverified deliverables without fabricating completion.

---

### Sprint 7 (Hours 36–42) — UI/UX Polish, Responsive QA & Stabilization
- **Accelerated Target:** 45–60 min
- **Objective:** Transform every screen into a cohesive, accessible, responsive (`375px` mobile + desktop) B2B SaaS marketplace and execute the complete test matrix.
- **Tasks:**
  1. Audit and polish landing page, dashboards, event cards, package tiers, match breakdown visualizations, PayPal checkout UI, and evidence reports.
  2. Verify loading skeletons, empty states, inline errors, toast/banner feedback, and zero placeholder dead buttons.
  3. Write automated tests (`tests/`) covering deterministic matching, Zod schemas, payment state/amount guards, and webhook idempotency.
  4. Execute full manual/API verification across all 14 cases in `TESTING.md`, including `375px` viewport checks and console error audit.
  5. Fix all P0/P1 bugs and verify clean `tsc --noEmit`, ESLint, and production `next build`.
- **Gate 7 Acceptance Criteria:**
  - Zero TypeScript/ESLint/build errors and zero critical console errors.
  - All P0 and P1 test cases in `TESTING.md` pass.
  - Mobile `375px` layout has zero horizontal overflow and all primary flows work.

---

### Sprint 8 (Hours 42–48) — Deployment, Demo Setup & Hackathon Submission
- **Accelerated Target:** 45–60 min
- **Objective:** Production deployment, seeded demo readiness, comprehensive documentation, and 3-minute demo delivery.
- **Tasks:**
  1. Configure production environment variables on Vercel/Render and verify live Supabase + PayPal Sandbox + AI keys.
  2. Seed clean demo dataset (1 university, 2 societies, 3 events, 4 sponsors, packages, pre-built demo accounts).
  3. Smoke-test full E2E flow on live hosted URL in fresh incognito session.
  4. Complete `README.md` (all 18 required sections, including APIMatic documentation, PayPal Sandbox instructions, demo accounts, and honest limitations).
  5. Add root `LICENSE` (after confirming open-source license choice, e.g., MIT), verify `.env.example` completeness, ensure no secrets in Git history, and prepare 3-minute demo script checklist.
- **Gate 8 Final Acceptance Criteria:**
  - Hosted app accessible publicly via HTTPS.
  - Complete 9-step journey works end-to-end live.
  - Public repo, `README.md`, `LICENSE`, `.env.example`, migrations, and demo guide ready for judges.
