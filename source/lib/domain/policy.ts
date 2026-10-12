import type { Plan, PlanId } from "./types";

export const DEMO_TODAY = "2026-10-28";

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPriceCents: 4_500,
    annualPriceCents: 48_600,
  },
  professional: {
    id: "professional",
    name: "Professional",
    monthlyPriceCents: 10_000,
    annualPriceCents: 108_000,
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthlyPriceCents: 20_000,
    annualPriceCents: 216_000,
  },
};

export const COMMISSION_POLICY = {
  rateBps: 3_500,
  eligibilityMonths: 12,
  holdDays: 7,
  settlementDay: 5,
  bankPayoutLagDays: 2,
  minimumPayoutCents: 0,
  suggestedMinimumPayoutCents: 2_500,
  currency: "USD",
} as const;

export type PolicyDecision = {
  key: string;
  label: string;
  sampleValue: string;
  detail: string;
  specRef: string;
};

export const POLICY_DECISIONS: PolicyDecision[] = [
  {
    key: "rate",
    label: "Commission rate",
    sampleValue: "35% of eligible revenue",
    detail: "Applied to each eligible Vendor subscription payment.",
    specRef: "§3.2",
  },
  {
    key: "duration",
    label: "Commission duration",
    sampleValue: "12 months from first eligible paid subscription",
    detail:
      "Renewals after the window close are recorded with $0.00 commission.",
    specRef: "§3.3",
  },
  {
    key: "frequency",
    label: "Payout frequency",
    sampleValue: "Monthly",
    detail: "One settlement batch per Broker per calendar month.",
    specRef: "§9",
  },
  {
    key: "settlement",
    label: "Payout settlement date",
    sampleValue: "5th day of the following month",
    detail:
      "Stripe transfer on the 5th; bank payout typically arrives 2 days later.",
    specRef: "§18.1",
  },
  {
    key: "hold",
    label: "Holding period",
    sampleValue: "7 days",
    detail: "Commission stays Pending for 7 days in case of early refunds.",
    specRef: "§11.3",
  },
  {
    key: "base",
    label: "Commission base",
    sampleValue:
      "Collected subscription revenue after discounts/credits, excluding tax",
    detail: "Tax and failed or $0 invoices never earn commission.",
    specRef: "§11.2",
  },
  {
    key: "annual",
    label: "Annual subscription treatment",
    sampleValue: "Cash-based: commission when the annual payment is collected",
    detail: "Alternative: spread the annual commission across 12 months.",
    specRef: "§11.4",
  },
  {
    key: "threshold",
    label: "Minimum payout threshold",
    sampleValue: "Not applied in demo (option: $25 with rollover)",
    detail: "Amounts below the threshold would roll forward to the next month.",
    specRef: "§11.5",
  },
  {
    key: "refunds",
    label: "Refund treatment",
    sampleValue:
      "Separate negative adjustment; carried forward if the month was already paid",
    detail: "Original commission rows are never edited or deleted.",
    specRef: "§12",
  },
  {
    key: "ownership",
    label: "Referral ownership",
    sampleValue: "First valid Broker attribution wins; Admin override only",
    detail: "Overrides require a reason and are written to the audit log.",
    specRef: "§13.2",
  },
  {
    key: "existing",
    label: "Existing Vendor attribution",
    sampleValue: "Existing unattributed Vendors go to Admin review",
    detail: "Business to decide whether they can be claimed later.",
    specRef: "§13.3",
  },
  {
    key: "currency",
    label: "Multi-currency",
    sampleValue: "USD only",
    detail: "Additional currencies only if the business requires them.",
    specRef: "§23",
  },
];
