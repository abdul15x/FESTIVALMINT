# FESTIVALMINT AI

> **Great university events deserve the right sponsors.**

FESTIVALMINT AI is a two-sided AI-powered sponsorship marketplace connecting university societies and student event organizers with compatible corporate sponsors—covering structured event briefs, AI sponsorship package generation, deterministic + AI-explained compatibility matching, in-app sponsorship proposals, **PayPal Sandbox** checkout and verified webhooks, and post-event deliverable fulfillment & AI performance reporting.

---

## 1. The Problem

University societies and student organizers struggle to price sponsorship tiers professionally, identify brands that fit their student demographic, formalize proposals cleanly, and prove post-event ROI. Conversely, corporate sponsors lack a structured discovery channel to find high-fit campus hackathons, summits, and cultural festivals outside slow manual outreach.

---

## 2. Solution Overview

FESTIVALMINT AI turns an unstructured event brief into an end-to-end commercial sponsorship lifecycle:
1. **Organizers** create an event, generate structured Bronze/Silver/Gold tiers via AI, edit & save them, and submit for verification.
2. **University Admins** verify societies and approve event listings before public discovery (writing to `audit_logs`).
3. **Sponsors** create brand profiles, filter approved campus events, inspect transparent 6-factor match scores + AI fit explanations, and respond to proposals or select packages directly.
4. **PayPal Sandbox** handles server-verified Orders v2 checkout creation, payment capture, deliverable seeding, and verified idempotent webhook reconciliation.
5. **Post-Event Fulfillment** lets organizers upload proof files (`evidence` private bucket) or URLs/notes, lets sponsors verify deliverables, and generates an evidence-grounded AI Performance Report.

---

## 3. Core Features by Role

- **University Organizer (`/organizer/*`):** Society onboarding, Event CRUD (`/organizer/events/new`, `/organizer/events/[id]`), AI Package Studio (`POST /api/ai/packages`, `PUT /api/events/[id]/packages`), Ranked Sponsor Matches + AI Outreach Drafter (`/organizer/matches`), Proposal pipeline (`/organizer/proposals`), Evidence upload & Performance Reports (`/organizer/reports/[id]`).
- **Brand Sponsor (`/sponsor/*`):** Brand profile & budget onboarding, Approved Event Discovery & filters (`/sponsor/discover`), Event & 6-Factor Match Detail (`/sponsor/events/[id]`), Proposal Accept/Reject/Request Changes (`/sponsor/proposals`), PayPal Sandbox Checkout (`/sponsor/payments/[id]`), Deliverable verification & Reports (`/sponsor/reports/[id]`).
- **University Admin (`/admin/*`):** Moderation Queue (`/admin/reviews`) to approve/reject organizer societies and event listings, Account Moderation (`/admin/users`), and `audit_logs`. *(Admin accounts cannot be created via public sign-up.)*

---

## 4. Architecture & Database Summary

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the complete system diagram, API contract, and 17-table relational PostgreSQL schema (`supabase/migrations/0001_initial_schema.sql` through `0004_storage_bucket.sql`) protected by Row Level Security and anti-escalation triggers. All monetary values use integer minor units (`*_minor` + ISO `currency`).

---

## 5. Tech Stack

- **Framework:** Next.js 16.4.6 (App Router, `proxy.ts`), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4 + accessible UI primitives + Lucide icons
- **Database, Auth & Storage:** Supabase (PostgreSQL + RLS, `@supabase/ssr`, private `evidence` Storage bucket)
- **Validation:** Zod v4
- **AI Layer:** Google Gemini (`gemini-2.5-flash`) or OpenAI (`gpt-4o-mini`) via server-only structured JSON + prompt-injection delimiters (`<untrusted_data>`) + rate limiting
- **Payments:** PayPal Server SDK (`@paypal/paypal-server-sdk` `2.5.0` exact pin) + `@paypal/react-paypal-js` (Sandbox Orders v2 & webhook signature verification)
- **Dev Tooling:** PayPal APIMatic Server SDK Context Plugin (`https://github.com/paypaldev/server-sdk-context-plugin-preview`)

---

## 6. APIMatic PayPal Context Plugin Usage

During Sprint 5 development, the official preview **PayPal APIMatic Server SDK Context Plugin** was installed locally as a development-time coding context assistant:
```bash
npx --yes context-plugins install https://github.com/paypaldev/server-sdk-context-plugin-preview --force --yes --targets vscode,cursor
```
- **Role:** Development-time SDK reference/context aid for `@paypal/paypal-server-sdk` (`2.5.0` exact pin) guidance across `typescript-getting-started`, `typescript-client-initialization`, `typescript-authentication`, `typescript-calling-endpoints`, `typescript-models`, `typescript-error-handling`, `typescript-configuration-resilience`, and `typescript-testing`.
- **Patterns Applied:** Long-lived singleton `Client` reuse, explicit non-zero `timeout` (overriding `DEFAULT_CONFIGURATION.timeout = 0`), `oAuthClockSkew: 60`, split value/type imports (`isolatedModules`), `PayPal-Request-Id` idempotency, `AbortSignal` per-request cancellation, typed `CustomError`/`OAuthProviderError`/`ApiError` wire-error extraction (`debug_id`, `details`), and `unstable_httpClientOptions.adapter` stub unit tests.
- **Boundary:** The Context Plugin is strictly a developer tooling aid (requires no APIMatic API key and provides no runtime credentials). All runtime PayPal API calls execute through `@paypal/paypal-server-sdk@2.5.0` (Orders v2) and PayPal's `/v1/notifications/verify-webhook-signature` endpoint (since `@paypal/paypal-server-sdk@2.5.0` does not ship a Webhooks controller).

---

## 7. PayPal Sandbox Checkout & Webhook Verification Scope

- **Server-Side Pricing Authority:** `POST /api/paypal/orders` ignores any client-supplied amount/currency and loads `amount_minor` and `currency` strictly from the accepted/payment-pending `proposals` row in PostgreSQL.
- **Capture Verification:** `POST /api/paypal/capture` executes server-side capture via `ordersController.captureOrder`, verifies `status === 'COMPLETED'`, matching currency, and exact minor amount match, persists `paypal_capture_id` to `payments`, marks the proposal `paid`, and auto-seeds `deliverables`.
- **Verified Idempotent Webhooks:** `POST /api/paypal/webhook` validates signature headers against PayPal's `/v1/notifications/verify-webhook-signature` API (`PAYPAL_WEBHOOK_ID`) and enforces duplicate-event idempotency via `webhook_events.paypal_event_id`.
- **Sandbox Scope Disclaimer:** Funds settle directly to the configured Sandbox merchant account in MVP; multi-party split payouts and escrow holds are explicitly out of scope.

---

## 8. Explainable 6-Factor Matching & Honest AI Fallbacks

Compatibility scores (`0–100`) are computed deterministically in TypeScript (`lib/matching/scorer.ts`):
- `audience_fit` (**30%**)
- `industry_fit` (**20%**)
- `budget_fit` (**20%**)
- `location_fit` (**10%**)
- `benefit_fit` (**10%**)
- `timing_fit` (**10%**)

Missing profile/event attributes populate `missing_information` and downgrade `confidence` (`high` → `medium` → `low`). When `GEMINI_API_KEY` / `OPENAI_API_KEY` is absent or unavailable, package generation, match explanations, and performance reports fall back cleanly to clearly labeled deterministic logic (`deterministic_fallback`) without claiming live AI output.

---

## 9. Repository Structure

```text
app/
  api/                  # Auth, Events, AI (packages/matches/outreach/reports), Proposals, PayPal, Evidence, Admin, Health
  auth/                 # /auth/sign-in, /auth/sign-up, /auth/callback
  onboarding/           # Role-specific Organizer / Sponsor profile setup
  organizer/            # Dashboard, Events CRUD & Package Studio, Matches, Proposals, Reports
  sponsor/              # Dashboard, Discovery, Event Detail, Proposals, PayPal Checkout, Reports
  admin/                # Dashboard, Moderation Queue, User Moderation
components/             # Reusable UI primitives, layout shells, domain forms & interactive studios
lib/                    # env, supabase (client/server/admin/proxy), auth/session, ai/*, matching/*, paypal/*, validation/*
supabase/migrations/    # 0001_initial_schema.sql .. 0004_storage_bucket.sql + seed.sql
scripts/                # seed-demo.mjs (server-side Auth + demo profile linker)
tests/                  # Automated unit/contract tests (18 tests across 5 suites)
```

---

## 10. Prerequisites & Environment Setup

- Node.js `>= 20` (tested on `v24.18.1`) and `npm`
- A Supabase project, Google Gemini (or OpenAI) key, and PayPal Developer Sandbox App

Copy `.env.example` to `.env.local` and follow [CREDENTIALS_SETUP.md](./CREDENTIALS_SETUP.md) to configure Supabase, AI, and PayPal Sandbox credentials.

---

## 11. Database Setup & Demo Seed Data

1. Run SQL files in Supabase SQL Editor in order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_sponsor_proposals.sql`
   - `supabase/migrations/0004_storage_bucket.sql`
   - `supabase/seed.sql`
2. Seed Auth accounts (clearly labeled fictional demo users):
   ```bash
   node scripts/seed-demo.mjs
   ```
   - Organizer Demo: `organizer.demo@festivalmint.local` (`CampusSpark Tech Society (Demo)`)
   - Sponsor Demo: `sponsor.demo@festivalmint.local` (`Northstar Cloud APIs (Demo)`)
   - Admin Demo: `admin.demo@festivalmint.local` (`University Moderator (Demo Admin)`)
   - Default Password: value of `DEMO_SEED_PASSWORD` (`DemoMint!2026`)

---

## 12. Running Locally & Testing

```bash
npm install
npm run dev          # Development server at http://localhost:3000

# Verification suite
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # tsx --test tests/*.test.ts (18/18 passing)
npm run build        # Production build
npm start            # Start production server
```

See [TESTING.md](./TESTING.md) for the complete test matrix and 14-point acceptance plan.

---

## 13. Deployment Guide (Vercel / Render)

1. Push repository to GitHub (`main` branch).
2. Import into Vercel or Render as a Next.js project (`npm run build` / `npm start`).
3. Configure all server & public environment variables from `.env.example` and update `NEXT_PUBLIC_APP_URL` to your deployed HTTPS origin.
4. Register `https://<your-domain>/api/paypal/webhook` in PayPal Sandbox Webhooks and set `PAYPAL_WEBHOOK_ID`.

---

## 14. 3-Minute Hackathon Demo Script

1. **Problem & Positioning (`0:00–0:25`):** Show `/` hero and explain how university events connect with aligned brand sponsors in one workflow.
2. **Organizer Brief & AI Packages (`0:25–1:05`):** Sign in as `organizer.demo@festivalmint.local`, open an event, generate & edit Bronze/Silver/Gold tiers in `PackageStudio`, and submit for verification.
3. **Sponsor Discovery & Explainable Matching (`1:05–1:50`):** Sign in as `sponsor.demo@festivalmint.local`, browse `/sponsor/discover`, open `BuildFest Campus AI Hackathon 2026 (Demo)`, inspect the 6-factor score breakdown + missing info + AI explanation, and select a package.
4. **PayPal Sandbox Checkout (`1:50–2:30`):** Complete checkout at `/sponsor/payments/[id]` via PayPal Sandbox popup, show server-verified `COMPLETED` capture ID and auto-seeded deliverables.
5. **Fulfillment Evidence & AI Report (`2:30–3:00`):** Upload proof at `/organizer/reports/[id]`, generate the performance report, and show how Verified Facts, Organizer Claims, and Missing Deliverables are cleanly separated.

---

## 15. Known Limitations & License

- Multi-party split payouts / escrow are intentionally excluded (direct Sandbox merchant settlement only).
- Remote database migrations, live Gemini API calls, and live PayPal Sandbox captures require credentials in `.env.local` (all offline/fallback paths operate honestly and transparently without faking transactions).
- Licensed under the [MIT License](./LICENSE).
