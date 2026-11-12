# FESTIVALMINT AI — Credential & Environment Setup Guide

Follow this guide to connect **Supabase**, **Gemini / OpenAI**, and **PayPal Sandbox** in `.env.local` (never commit `.env.local` to Git).

---

## 1. Create `.env.local`
Copy the safe template:
```bash
cp .env.example .env.local
```

---

## 2. Supabase (Database, Auth & Private Evidence Storage)

1. Sign in at [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project (e.g., `festivalmint-ai`).
2. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` *(keep strictly server-side; never prefix with `NEXT_PUBLIC_`)*
3. Apply the SQL migrations **in order** inside **SQL Editor** (or via Supabase CLI):
   1. `supabase/migrations/0001_initial_schema.sql` (17 relational tables + triggers)
   2. `supabase/migrations/0002_rls_policies.sql` (Row Level Security + anti-escalation triggers)
   3. `supabase/migrations/0003_sponsor_proposals.sql` (Sponsor package selection RLS policy)
   4. `supabase/migrations/0004_storage_bucket.sql` (Private `evidence` bucket + storage policies)
   5. `supabase/seed.sql` (Fictional demo university, 2 societies, 3 events, 4 packages, 4 sponsors)
4. Optional — create live Auth demo users (Organizer, Sponsor, Admin):
   ```bash
   node scripts/seed-demo.mjs
   ```
   - Organizer Demo: `organizer.demo@festivalmint.local`
   - Sponsor Demo: `sponsor.demo@festivalmint.local`
   - Admin Demo: `admin.demo@festivalmint.local`
   - Password: value of `DEMO_SEED_PASSWORD` in `.env.local` (default `DemoMint!2026`).

---

## 3. AI Provider (Google Gemini — Recommended, or OpenAI)

FESTIVALMINT AI uses structured JSON output for sponsorship package generation, match explanations, outreach drafts, and performance reports—and automatically falls back to deterministic logic when no API key is configured.

### Option A: Google Gemini (Default)
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and generate an API key.
2. Add to `.env.local`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-api-key
   GEMINI_MODEL=gemini-2.5-flash
   ```

### Option B: OpenAI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

---

## 4. PayPal Sandbox (`@paypal/paypal-server-sdk` Orders v2 & Webhooks)

1. Sign in at [developer.paypal.com/dashboard](https://developer.paypal.com/dashboard).
2. Navigate to **Apps & Credentials → Sandbox → Create App** (Merchant: Sandbox Business account).
3. Copy **Client ID** and **Secret Key**:
   ```env
   PAYPAL_ENV=sandbox
   PAYPAL_CLIENT_ID=your-sandbox-client-id
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-sandbox-client-id
   PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
   ```
4. **Sandbox Buyer Account (for test checkouts):**
   - Go to **Sandbox → Accounts** and note the email & password of your **Personal** sandbox buyer account to sign in inside the PayPal checkout popup during testing/demo.
5. **Webhook Verification (Recommended for reconciliation):**
   - In your PayPal Sandbox App settings, scroll to **Sandbox Webhooks → Add Webhook**.
   - Webhook URL: `https://<your-domain>/api/paypal/webhook` (for local testing use a tunnel such as `cloudflared` or `ngrok`).
   - Subscribe to: `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`.
   - Copy the generated **Webhook ID** into `.env.local`:
     ```env
     PAYPAL_WEBHOOK_ID=your-sandbox-webhook-id
     ```

---

## 5. Verify Configuration Health
Start the server (`npm run dev` or `npm start`) and visit `GET /api/health` to confirm every boolean readiness flag (`supabasePublic`, `supabaseAdmin`, `aiProvider`, `paypalServer`, `paypalClient`, `paypalWebhook`) without exposing secrets.
