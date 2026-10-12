# C2V Broker Affiliate & Commission — Prototype

Clickable customer-approval prototype of the **Broker Portal** and **C2V Admin console** described in
_C2V Broker Affiliate & Commission Prototype Specification_. Everything runs on deterministic mock data in the
browser. Nothing connects to Recurly, Stripe, a bank or production C2V services.

Built on the Client2Vendor architecture: Next.js 14 (App Router), strict TypeScript, Tailwind CSS with `cn()`,
React Hook Form + Zod, Framer Motion, ESLint (`next/core-web-vitals` + `next/typescript`) and Prettier.

## Run it

Requires Node.js 18.17+ and internet access for the first build (DM Sans is loaded from Google Fonts).

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to the Broker sign-in page.

| Role | Email | Password |
| --- | --- | --- |
| Broker (Michael Carter, Town Square Realty) | `michael.carter@townsquarerealty.com` | `Town35-Demo!` |
| C2V Admin (Sarah Kim) | `sarah.kim@client2vendor.com` | `Town35-Demo!` |
| Not-activated Broker user (error state) | `jordan.lee@townsquarerealty.com` | anything |

The sign-in page has a **Fill in demo credentials** button.

## Demo controls

Every portal page has a **Demo controls** button in the top bar (prototype only):

- **View as** Broker or C2V Admin
- **Stripe payout setup state** — Not Connected, Onboarding Incomplete, Under Review, Connected, Action Required
- **Fail the September bank payout** — transfer stays successful, bank payout fails, recovery UX appears
- **Preview as a brand-new Broker** — no referred Vendors, no commission and no payout account (empty states)
- **Reset demo data**

Demo state is kept in `localStorage` so a refresh keeps the scenario. The demo date is fixed at **Oct 28, 2026**.

## Customer walkthrough (spec §20)

1. Sign in as Michael Carter → **Dashboard** (KPIs: 245 Agents, 83 referred, 61 active paid, $1,275.50 pending, $4,218.75 available, $3,640.00 last payout).
2. **Agents** — brokerage visibility, separate from affiliate revenue.
3. **Referral Link & Code** — copy `TOWN35` and the link; attribution rules.
4. **Referred Vendors** — filter Active Subscribers vs Not Subscribed; open **ABC Plumbing**.
5. **Commissions** (September 2026) — summary $10,900 → $10,700 eligible × 35% = $3,745 − $105 = $3,640.
6. Filter **Adjustment / Refund**, open ABC Plumbing's `CR-101`: original +$35.00 kept, separate −$14.00 entry.
7. **Payouts & Statements** → September statement: net → Stripe transfer `tr_demo_sep_2026` → bank payout paid Oct 07.
8. **Payout Settings** — Connected; then Demo controls → _Fail the September bank payout_ to show Action Required and the recovery flow (simulated Stripe onboarding).
9. Demo controls → **View as C2V Admin**: Brokers, Payout Exceptions, Commission Configuration, Audit Logs.

## Screens

| Area | Routes |
| --- | --- |
| Broker | `/broker/login`, `/broker/dashboard`, `/broker/agents`, `/broker/referrals`, `/broker/vendors`, `/broker/vendors/[id]`, `/broker/commissions`, `/broker/payouts`, `/broker/payouts/[id]`, `/broker/payout-settings`, `/broker/notifications`, `/broker/profile` |
| Admin | `/admin/brokers`, `/admin/brokers/[id]`, `/admin/referrals`, `/admin/configuration`, `/admin/commissions`, `/admin/payouts`, `/admin/payouts/[id]`, `/admin/exceptions`, `/admin/audit-logs` |

Referral Performance is part of the Referral page, and Statements are the payout detail pages.

## How the data works

`lib/mock` simulates each Vendor's Recurly subscription (plan, billing frequency, renewals, failures, refunds,
cancellations) and `lib/mock/engine.ts` derives everything else from it: invoices, the immutable commission
ledger, refund adjustments, monthly payout batches, statuses and notifications. Every total on screen is
computed from the ledger, so the Dashboard, Commissions, Payouts and Admin views always agree.

- Money is stored in integer cents; commission = eligible amount × rate, rounded per ledger entry.
- The eligibility window is 12 months from the first paid invoice. Payments after it are recorded with $0.00 commission and a reason.
- Commission stays **Pending** for 7 days, then becomes **Eligible**. Months settle on the 5th (transfer) and the bank payout arrives 2 days later.
- Refunds create separate negative entries. If the original month was already paid, the entry is flagged **carried forward**.

`npm test` (Vitest) checks the spec's numbers (September summary, payout list, KPIs, Admin Broker list) and ledger
integrity: one entry per paid invoice, batch totals equal ledger sums, and no commission on failed payments.

### Deliberate choices where the spec's samples conflict

| Spec | Prototype |
| --- | --- |
| Last Payout $3,840.25 (§7.2) vs September payout $3,640.00 (§9.1) | $3,640.00 |
| September is paid Oct 5–7 but the doc date is Sep 24 | Demo date fixed at Oct 28, 2026 |
| $1,275.50 / $4,218.75 can't come from $100/$200 plans at 35% | Adds a Starter plan, annual plans and prorated mid-cycle upgrades |
| Two Vendor name sets (§7.5 vs §18.3) | §18.3 is used everywhere |
| Only one named refund but −$105 of adjustments | Adds a $200 full refund and a $60 service credit |

All business rules (rate, duration, hold, settlement date, threshold, annual treatment, refund handling,
attribution) are shown with an **awaiting approval** badge and listed on Admin → Commission Configuration.

## Project structure

```
app/
  broker/login/                 public sign-in
  broker/(portal)/…             Broker screens (AppShell, session guard)
  admin/(console)/…             Admin screens
  api/health/route.ts           health check
components/
  shell/        AppShell, navigation, DemoControls
  ui/           Button, Card, KpiCard, StatusBadge, DataTable, Drawer, Modal, Toast, Tooltip, …
  charts/       CommissionTrendChart, RevenueSplitChart, ReferralFunnel (plain SVG)
  broker/       CommissionSummary, CommissionTransactionDrawer, PayoutStatusTimeline,
                ReferralLinkCard, SimulatedStripeOnboarding, views/*
  admin/        ReasonModal, AuditLogTable, adminSelectors, views/*
  forms/        FormInput, FormTextarea, FormCheckbox, FormSubmitButton
lib/
  domain/       types, dates, money, policy, status labels, selectors, reconciliation tests
  mock/         deterministic generator, Town Square + 3 Admin Brokers, audit seed
  store/        DemoProvider (React context + reducer, localStorage)
  validation.ts Zod schemas (login, onboarding steps, audit reasons)
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build and local serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (data reconciliation) |
| `npm run format` | Prettier |

## Out of scope

No real money movement, bank-account collection, Stripe/Recurly keys, production authentication or tax logic.
The contact-form email backend from the original scaffold has been removed.
