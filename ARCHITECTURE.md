# FESTIVALMINT AI — System Architecture

## 1. High-Level Architecture

```
Browser (Organizer / Sponsor / Admin — Desktop & 375px Mobile)
  │
  ▼
Next.js App Router (TypeScript + Tailwind CSS)
  ├── Public & Auth Pages (/, /auth/sign-in, /auth/sign-up, /onboarding)
  ├── Role Dashboards (/organizer/*, /sponsor/*, /admin/*)
  └── Next.js Route Handlers (/api/*) — Zod Validated + Server Session Auth
        ├── Supabase Auth (@supabase/ssr cookie session verification)
        ├── Supabase PostgreSQL (17 relational tables + strict RLS)
        ├── Supabase Storage (private `evidence` bucket + signed URLs)
        ├── AI Service Layer (Gemini / OpenAI structured JSON + prompt-injection guards)
        ├── Deterministic Matching Engine (TypeScript 6-factor 0–100 scorer)
        └── PayPal Server SDK (@paypal/paypal-server-sdk Orders v2 + Webhook verify)
              ▲
              └── Developed using APIMatic PayPal Context Plugin (dev-time only)
```

---

## 2. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js App Router + React + TypeScript | Single responsive web application |
| Styling & UI | Tailwind CSS + custom accessible shadcn-style primitives | Lucide icons, `Plus Jakarta Sans` / `Inter` / `JetBrains Mono` |
| Backend | Next.js Route Handlers + Server Components | Strict Zod validation & role/ownership enforcement |
| Database | Supabase PostgreSQL | UUID PKs, minor-unit money (`*_minor`), RLS, SQL migrations |
| Auth | Supabase Auth (`@supabase/ssr`) | Cookie sessions, protected routes, non-selectable admin |
| File Storage | Supabase Storage | Private bucket (`evidence`), MIME/size check, signed URLs |
| AI Provider | Gemini API (`@google/genai` or REST) / OpenAI API | Server-only structured JSON, timeout & rate limiting |
| Payments | `@paypal/paypal-server-sdk` (v2.5.0) + PayPal JS SDK | Sandbox Orders v2 create, capture, webhook signature verify |
| Dev Tooling | APIMatic PayPal Context Plugin (`context-plugins`) | Used during Sprint 5 implementation; NOT a runtime library |
| Deployment | Vercel or Render | HTTPS deployment + hosted webhook endpoint |

---

## 3. Information Architecture & Route Map

### Public & Authentication Routes
- `/` — Landing page (value prop, workflow steps, dual Organizer/Sponsor CTAs, featured verified events)
- `/auth/sign-in` — Email/password login + demo account guidance
- `/auth/sign-up` — Sign up with explicit `organizer` or `sponsor` selection (never `admin`)
- `/auth/callback` — Supabase auth callback handler
- `/onboarding` — Role-specific profile completion (`organizer_profiles` or `sponsor_profiles`)

### Organizer Routes (`/organizer/*`)
- `/organizer/dashboard` — Events, proposals, match alerts, payment summaries
- `/organizer/events/new` — Create event form (validated against Section 4.3 rules)
- `/organizer/events/[id]` — Event overview, verification status, AI package generator & editor, event matches
- `/organizer/matches` — Ranked sponsor matches with 6-factor score breakdown & missing info
- `/organizer/proposals` — Sent proposals & status timeline
- `/organizer/reports/[id]` — Deliverable checklist, evidence uploads, AI sponsorship performance report

### Sponsor Routes (`/sponsor/*`)
- `/sponsor/dashboard` — Top matched events, active proposals, sandbox spend summary
- `/sponsor/discover` — Search & filter `approved`/`published` university events
- `/sponsor/events/[id]` — Event details, verification badge, packages, AI match explanation
- `/sponsor/proposals` — Incoming proposals, accept/reject/request changes actions
- `/sponsor/payments/[id]` — Accepted proposal checkout using PayPal Sandbox Buttons & server capture status

### Admin Routes (`/admin/*`)
- `/admin/dashboard` — Platform verification queue & overview counts
- `/admin/reviews` — Approve/reject organizers and events with internal audit notes
- `/admin/users` — Account moderation (suspend/reactivate)

### Shared Authenticated Route
- `/settings/profile` — Role-appropriate profile management

### API Route Contract (`/api/*`)
- `GET /api/health` — Runtime readiness & non-secret configuration diagnostics
- `POST /api/events` | `GET /api/events/mine` | `PATCH /api/events/[id]` | `POST /api/events/[id]/submit` | `GET /api/events/discover`
- `POST /api/ai/packages` — Structured AI Bronze/Silver/Gold package generation
- `POST /api/ai/matches` — Deterministic scoring + cached AI match explanations
- `POST /api/ai/outreach` — Editable sponsor proposal message draft
- `POST /api/proposals` | `PATCH /api/proposals/[id]/respond`
- `POST /api/paypal/orders` | `POST /api/paypal/capture` | `POST /api/paypal/webhook`
- `POST /api/evidence` — Deliverable evidence file/link persistence & signed URL retrieval
- `POST /api/ai/reports` — Evidence-grounded AI performance report
- `POST /api/admin/review` — Admin verification & audit logging

---

## 4. Database Schema Design (17 Tables)

All tables live in `supabase/migrations/0001_initial_schema.sql` with UUID primary keys, `created_at`/`updated_at` timestamps, foreign key integrity, performance indexes, and Row Level Security (`0002_rls_policies.sql`). Money is strictly integer minor units (`price_minor`, `amount_minor`, `budget_min_minor`, `budget_max_minor`) with explicit `currency`.

1. `profiles` — Core user identity (`id` -> `auth.users`), `role` (`organizer | sponsor | admin`), `full_name`, `email`, `status`.
2. `universities` — University registry (`name`, `city`, `country`, `website`, `verification_status`).
3. `organizer_profiles` — Society profile (`user_id`, `society_name`, `university_id`, `category`, `description`, `contact_person`, `official_email`, `verification_status`).
4. `sponsor_profiles` — Brand profile (`user_id`, `company_name`, `industry`, `description`, `website`, `operating_locations`, `products_services`, `target_tags`, `objectives`, `budget_min_minor`, `budget_max_minor`, `preferred_categories`, `preferred_locations`, `preferred_benefits`, `contact_email`, `verification_status`).
5. `events` — Event listings (`organizer_id`, `university_id`, `title`, `description`, `category`, `city`, `country`, `starts_at`, `ends_at`, `expected_attendees`, `audience_tags`, `social_reach`, `sponsorship_target_minor`, `currency`, `sponsorship_needs`, `status`: `draft | pending_review | approved | published | completed | rejected | cancelled`).
6. `event_benefits` — Available sponsorship inventory (`event_id`, `benefit_type`, `description`, `quantity`).
7. `sponsorship_packages` — Package tiers (`event_id`, `name`, `description`, `price_minor`, `currency`, `benefits_json`, `availability`, `ideal_sponsor_categories`, `pricing_rationale`, `assumptions_json`, `ai_generated`, `approved_by_organizer`, `status`).
8. `matches` — Cached match scores & explanations (`event_id`, `sponsor_id`, `score`, `confidence`, `factor_scores_json`, `explanation`, `missing_info_json`, `recommended_package_id`, `profile_snapshot_at`).
9. `proposals` — Deal agreements (`event_id`, `sponsor_id`, `package_id`, `organizer_id`, `amount_minor`, `currency`, `message`, `change_request_note`, `status`, `expires_at`, `version`).
10. `proposal_events` — Proposal lifecycle audit trail (`proposal_id`, `actor_id`, `event_type`, `note`, `metadata_json`).
11. `payments` — PayPal Sandbox transactions (`proposal_id`, `paypal_order_id`, `paypal_capture_id`, `amount_minor`, `currency`, `status`, `captured_at`, `raw_status_reason`).
12. `webhook_events` — Idempotent PayPal webhook registry (`paypal_event_id` UNIQUE, `event_type`, `received_at`, `processed_at`, `processing_status`, `payload_summary_json`).
13. `deliverables` — Promised sponsorship obligations (`proposal_id`, `title`, `description`, `due_at`, `status`: `pending | submitted | verified | not_verified | waived_by_sponsor`).
14. `evidence_files` — Deliverable proof (`deliverable_id`, `uploader_id`, `storage_path`, `file_type`, `source_url`, `notes`, `ai_analysis_json`, `review_status`).
15. `performance_reports` — Post-event reports (`proposal_id`, `generated_by`, `summary`, `report_json`).
16. `notifications` — In-app alerts (`user_id`, `title`, `body`, `read_at`, `related_type`, `related_id`).
17. `audit_logs` — Admin & security action history (`actor_id`, `action`, `entity_type`, `entity_id`, `metadata_json`).

---

## 5. Deterministic Matching & AI Boundaries

### Explainable 6-Factor Match Score (0–100)
Computed strictly in TypeScript (`lib/matching/scorer.ts`):
- `audience_fit`: **30%**
- `industry_fit`: **20%**
- `budget_fit`: **20%**
- `location_fit`: **10%**
- `benefit_fit`: **10%**
- `timing_fit`: **10%**

When required data is missing, the factor is penalized/marked partial, `missing_information` lists the exact missing fields, and `confidence` drops (`high` → `medium` → `low`). The LLM receives ONLY the sanitized non-PII event/sponsor summary + computed factor scores and generates a concise human-readable explanation.

---

## 6. PayPal Sandbox & APIMatic Architecture
- **PayPal Flow:** Only accepted proposals (`status = 'accepted'` or retrying `'payment_pending'`) can initialize a PayPal order. Server reads `proposals.amount_minor` and `proposals.currency`, converts to decimal string (`(amount_minor / 100).toFixed(2)`), creates an Orders v2 order via `@paypal/paypal-server-sdk`, stores `CREATED`, captures on server after buyer approval, and verifies webhooks idempotently.
- **Marketplace Scope:** Prototype captures funds directly to the configured Sandbox merchant account. No multi-vendor split payouts or escrow are claimed.
- **APIMatic Role:** Used via `context-plugins` during Sprint 5 development to ground `@paypal/paypal-server-sdk` client initialization, Orders v2 create/capture calls, and error structures against current official SDK signatures.

