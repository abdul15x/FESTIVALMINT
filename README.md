# FESTIVALMINT AI

> **Great university events deserve the right sponsors.**

FESTIVALMINT AI is an AI-powered sponsorship marketplace connecting university societies and event organizers with relevant brand sponsors—from structured event briefs and AI sponsorship package generation to explainable sponsor matching, PayPal Sandbox checkout, and post-event deliverable performance reporting.

## Current Sprint Status
- **Sprint 1 (Foundation & Architecture):** Complete / Verifying
- See [SPRINT_PLAN.md](./SPRINT_PLAN.md), [PROJECT_STATUS.md](./PROJECT_STATUS.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and [memory.md](./memory.md).

## Tech Stack
- **Frontend & API:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Database, Auth & Storage:** Supabase (PostgreSQL + RLS, Auth, Private Storage)
- **AI:** Gemini / OpenAI structured JSON outputs
- **Payments:** PayPal Server SDK (`@paypal/paypal-server-sdk`) Orders v2 (Sandbox)
- **Dev Tooling:** APIMatic PayPal Server SDK Context Plugin

## Local Setup
1. Copy `.env.example` to `.env.local` and supply your Supabase, AI provider, and PayPal Sandbox keys.
2. Apply SQL migrations in `supabase/migrations/` and optional demo seed data in `supabase/seed.sql` to your Supabase project.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).
