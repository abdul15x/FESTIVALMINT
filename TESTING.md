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

## 2. Automated Test Suite Plan (Created & Expanded in Sprints 3–7)
1. `tests/validation.test.ts` — Event, Sponsor, Package, Proposal Zod validation edge cases (invalid dates, negative prices, oversized text).
2. `tests/matching.test.ts` — Deterministic 6-factor scoring verification (high-fit vs. low-fit seeded sponsor pairs, missing fields lowering confidence, score bounded 0–100).
3. `tests/paypal-security.test.ts` — Server-side amount lookup verification (client-tampered amounts ignored), state transition guards (`draft`/`sent`/`paid` proposals cannot re-checkout), webhook event deduplication logic.
4. `tests/evidence-validation.test.ts` — Allowed MIME type/extension/file-size enforcement and report missing-deliverable preservation.

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

