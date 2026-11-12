# FESTIVALMINT AI — Testing & Verification Matrix

## 1. Continuous Verification Commands
Run after every module and before closing any sprint:
```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm test               # automated unit/contract tests
npm run build          # Next.js production compilation check
```

---

## 2. Automated Test Suite (`npm test` — 20/20 Passing)
1. `tests/sprint2-auth.test.ts` (5 tests) — Role-locked signup rejecting `admin`, valid organizer/sponsor signup, sponsor budget bounds, organizer profile validation, admin review schema.
2. `tests/sprint3-events-packages.test.ts` (3 tests) — Event date validation (`endsAt > startsAt`), deterministic Bronze/Silver/Gold package fallback, organizer package edit persistence validation.
3. `tests/sprint4-matching.test.ts` (3 tests) — Deterministic 6-factor scoring ranking strong-fit vs. poor-fit sponsors, missing info confidence degradation, proposal creation & response schema guards.
4. `tests/sprint5-paypal.test.ts` (6 tests) — Minor currency integer/decimal conversion without float drift, checkout state & ownership guards, PayPal capture tamper & status integrity checks, webhook duplicate ID idempotency & deliverable seeding, `@paypal/paypal-server-sdk` `OrdersController` `createOrder`/`captureOrder` stub-adapter serialization, and `CustomError` `debug_id`/`details` error mapping.
5. `tests/sprint6-evidence.test.ts` (3 tests) — File extension/MIME/10MB size limits rejecting `.exe` & oversized uploads, `http/https` URL validation, deterministic performance report preserving missing deliverables.

---

## 3. End-to-End Acceptance Matrix (14 Critical Checks)

| # | Area | Test Scenario | Pass Condition | Target Sprint |
|---|---|---|---|---|
| 1 | Auth | Register Organizer and Sponsor; attempt Admin | Assigned correct role & dashboard; Admin unreachable via sign-up | Sprint 2 |
| 2 | Authorization | Sponsor calls Organizer or Admin API route | `403 Forbidden`; zero DB mutation | Sprint 2 |
| 3 | Event Validation | Create event with end date < start date or missing fields | Clear validation error; no invalid row saved | Sprint 3 |
| 4 | Moderation Visibility | Unapproved (`draft` / `pending_review`) event queried in `/api/events/discover` | Excluded from Sponsor discovery | Sprint 3 / 4 |
| 5 | AI Packages | Generate AI packages for hackathon brief | Valid JSON matching Zod schema; organizer edits & saves | Sprint 3 |
| 6 | Explainable Matching | Run matcher against seeded strong-fit & weak-fit sponsors | Strong-fit scores higher with factor breakdown & missing fields | Sprint 4 |
| 7 | Proposal Security | Wrong sponsor attempts to accept proposal | `403 Forbidden`; status unchanged | Sprint 4 |
| 8 | PayPal Checkout | Sponsor completes PayPal Sandbox approval & capture | PayPal returns `COMPLETED` capture; `payments` & `proposals` updated server-side | Sprint 5 |
| 9 | Payment Tamper Guard | Modify amount in `POST /api/paypal/orders` client payload | Server ignores client amount and uses DB proposal amount | Sprint 5 |
| 10 | Webhook Idempotency | Replay identical PayPal webhook `event_id` twice | Second call returns `200` no-op; zero duplicate records | Sprint 5 |
| 11 | Evidence Upload Guard | Upload `.exe` or >10MB file to `/api/evidence` | Rejected with `400 Bad Request` | Sprint 6 |
| 12 | AI Report Integrity | Generate report with 1 of 3 deliverables evidenced | Missing/unverified deliverables explicitly flagged; never marked complete | Sprint 6 |
| 13 | Responsive QA | Test `/` and dashboards at `375px` and `1280px` | Zero horizontal overflow; primary buttons/forms usable | Sprint 7 |
| 14 | Live Deployment | Fresh incognito session on hosted URL with seeded demo login | App loads, seeded workflow & checkout work end-to-end | Sprint 8 |

