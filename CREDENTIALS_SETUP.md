# FESTIVALMINT AI — Complete External Setup Checklist

Follow this step-by-step guide to add real **Supabase**, **Google Gemini**, and **PayPal Sandbox** credentials to `.env.local` (never commit `.env.local` to Git).

---

## 1. Create or Open `.env.local`

If `.env.local` does not exist yet:
```bash
cp .env.example .env.local
```

> **Server-Only Security Rule:** Never share or commit `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `PAYPAL_CLIENT_SECRET`, or `PAYPAL_WEBHOOK_ID`, and never prefix them with `NEXT_PUBLIC_`.

---

## 2. Supabase (Database, Auth & Private Evidence Storage)

### Step A — Copy your 3 Supabase credentials
1. Open [supabase.com/dashboard](https://supabase.com/dashboard) and select your project (or click **New project** and wait ~2 minutes for provisioning).
2. In the left sidebar, click **Project Settings** (gear icon) → **API** (or **API Keys**):
   - Copy **Project URL** (`https://<your-ref>.supabase.co`) → paste into:
     - `NEXT_PUBLIC_SUPABASE_URL`
   - Under **Publishable and secret API keys** (or **Legacy anon, service_role API keys**):
     - Copy **Publishable key** (`sb_publishable_...`, or legacy `anon` public key) → paste into:
       - `NEXT_PUBLIC_SUPABASE_ANON_KEY` *(safe for browser/public client via RLS)*
     - Reveal and copy **Secret key** (`sb_secret_...`, or legacy `service_role` key) → paste into:
       - `SUPABASE_SERVICE_ROLE_KEY` *(strictly server-only; never expose in browser code)*

### Step B — Apply the database schema & private storage bucket (one shot)
1. In Supabase Dashboard, open **SQL Editor** → **+ New query**.
2. Open [`supabase/combined_setup.sql`](./supabase/combined_setup.sql) from this workspace, copy the entire file, paste it into the SQL Editor, and click **Run**.
   - This safely and idempotently executes migrations `0001`–`0004` + `seed.sql` in exact dependency order (17 tables, RLS policies, anti-escalation triggers, private `evidence` bucket, and demo event/sponsor catalog).

### Step C — Create Auth demo accounts (optional after SQL setup)
Run once after `combined_setup.sql` finishes:
```bash
node scripts/seed-demo.mjs
```
- Organizer Demo: `organizer.demo@festivalmint.local`
- Sponsor Demo: `sponsor.demo@festivalmint.local`
- Admin Demo: `admin.demo@festivalmint.local`
- Password: value of `DEMO_SEED_PASSWORD` in `.env.local` (default `DemoMint!2026`)

---

## 3. Google Gemini API (AI Package, Matching Explanations & Reports)

1. Sign in at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Click **Create API key**, select a Google Cloud project, and copy the key (starts with `AIza...`).
3. Put these values into `.env.local`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=AIza...your-real-key...
   GEMINI_MODEL=gemini-2.5-flash
   ```
   *(Server-only secret — never expose in client components. While absent, FestivalMint AI uses clearly labeled deterministic fallbacks.)*

---

## 4. PayPal Developer Sandbox (`@paypal/paypal-server-sdk@2.5.0`)

1. Sign in at [developer.paypal.com/dashboard](https://developer.paypal.com/dashboard).
2. Click **Apps & Credentials** and make sure the top toggle says **Sandbox** (NOT **Live**).
3. Click **Create App** (or open your existing **Sandbox** app using a Sandbox Business merchant account).
4. Copy **both** the Client ID and Secret Key from that **exact same Sandbox app** into `.env.local`:
   ```env
   PAYPAL_ENV=sandbox
   PAYPAL_CLIENT_ID=<same Sandbox Client ID>
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=<same Sandbox Client ID>
   PAYPAL_CLIENT_SECRET=<matching Sandbox Secret Key (server-only)>
   ```
   > If `/v1/oauth2/token` returns `401 invalid_client`, double-check that the toggle was set to **Sandbox**, not **Live**, and regenerate/re-copy the matching Client ID and Secret from that single Sandbox REST app.
5. **Get a Sandbox Buyer Account (for checkout popup testing):**
   - In the left navigation, open **Testing Tools → Sandbox Accounts**.
   - Find a **Personal** account row → click `...` → **View/Edit account** to note its Sandbox buyer email and password for signing in inside the PayPal checkout popup.
6. **Optional — Webhook Verification (`PAYPAL_WEBHOOK_ID`):**
   - In your Sandbox app settings, click **Add Webhook** pointing to `https://<your-public-or-tunnel-domain>/api/paypal/webhook` (for local testing use `cloudflared` or `ngrok`).
   - Subscribe to: `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`.
   - Copy the Webhook ID into `PAYPAL_WEBHOOK_ID`.

---

## 5. Restart App & Verify Live Integration Readiness

1. **Save `.env.local`** and restart Next.js so server and `NEXT_PUBLIC_*` variables reload:
   ```bash
   npm run dev
   ```
2. **Check structural + live readiness without printing secrets:**
   ```bash
   npm run readiness
   npm run readiness -- --live
   ```
3. **Check HTTP readiness endpoint:**
   Visit `http://localhost:3000/api/health` and confirm all boolean flags (`supabasePublic`, `supabaseAdmin`, `aiProvider`, `paypalServer`, `paypalClient`) are configured and `checks.*.structurallyValid` is `true`.
4. **Run the automated contract suite:**
   ```bash
   npm run typecheck && npm run lint && npm test && npm run build
   ```
