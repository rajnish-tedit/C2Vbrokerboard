import { addDays, monthRange } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import type {
  BrokerDataset,
  BrokerPayoutAccount,
  BrokerUser,
  ISODate,
  LoginStatus,
  MonthKey,
  PlanId,
} from "@/lib/domain/types";

import { generateAgents } from "./agents";
import {
  buildBrokerDataset,
  type BatchOutcome,
  type VendorSpec,
} from "./engine";
import { CITIES, createNameFactory, emailFor } from "./names";
import { createRng } from "./prng";

type BrokerParams = {
  id: string;
  companyName: string;
  city: string;
  domain: string;
  code: string;
  joinedAt: ISODate;
  loginStatus: LoginStatus;
  seed: number;
  ownerName: string;
  premium: number;
  professional: number;
  annualInSeptember: PlanId;
  startMonths: [MonthKey, MonthKey];
  nonPaid: { canceled: number; free: number; none: number; trial: number };
  septemberTargetCents: number;
  overrideVendor?: boolean;
  batchOutcome: (month: MonthKey) => BatchOutcome;
  payoutAccount: Omit<BrokerPayoutAccount, "brokerId">;
  agentMix: { active: number; inactive: number; invited: number };
  payoutsPaused?: boolean;
};

function makeBroker(p: BrokerParams): BrokerDataset {
  const rng = createRng(p.seed);
  const names = createNameFactory(rng);
  const months = monthRange(p.startMonths[0], p.startMonths[1]);
  const specs: VendorSpec[] = [];
  let n = 0;
  const base = (
    extra: Partial<VendorSpec> & Pick<VendorSpec, "registeredAt" | "status">,
  ): VendorSpec => {
    n += 1;
    const company = names.company();
    const loc = rng.pick(CITIES);
    return {
      key: `${p.id.slice(0, 2)}${String(n).padStart(3, "0")}`,
      companyName: company.name,
      trade: company.trade,
      contactName: names.person(),
      city: loc.city,
      state: loc.state,
      taxRateBps: loc.taxRateBps,
      source: rng.next() < 0.65 ? "referral_link" : "promo_code",
      ...extra,
    };
  };
  const day = () => String(rng.int(1, 28)).padStart(2, "0");
  const paidMonthly = (plan: PlanId) => {
    const firstPaidAt = `${rng.pick(months)}-${day()}`;
    return base({
      plan,
      billing: "monthly",
      firstPaidAt,
      registeredAt: addDays(firstPaidAt, -rng.int(0, 5)),
      status: "active",
    });
  };
  for (let i = 0; i < p.premium; i++) specs.push(paidMonthly("premium"));
  for (let i = 0; i < p.professional; i++)
    specs.push(paidMonthly("professional"));
  const annualDate = `2026-09-${day()}`;
  specs.push(
    base({
      plan: p.annualInSeptember,
      billing: "annual",
      firstPaidAt: annualDate,
      registeredAt: addDays(annualDate, -3),
      status: "active",
      source: p.overrideVendor ? "admin_override" : "promo_code",
    }),
  );
  for (let i = 0; i < p.nonPaid.canceled; i++) {
    const firstPaidAt = `${months[0]}-${day()}`;
    specs.push(
      base({
        plan: "professional",
        billing: "monthly",
        firstPaidAt,
        registeredAt: addDays(firstPaidAt, -2),
        endAt: addDays(firstPaidAt, 70),
        status: "canceled",
      }),
    );
  }
  const regDate = () =>
    `${rng.pick([...months, "2026-09", "2026-10"])}-${day()}`;
  for (let i = 0; i < p.nonPaid.free; i++)
    specs.push(base({ registeredAt: regDate(), status: "free" }));
  for (let i = 0; i < p.nonPaid.none; i++)
    specs.push(base({ registeredAt: regDate(), status: "none" }));
  for (let i = 0; i < p.nonPaid.trial; i++) {
    const registeredAt = `2026-10-${String(rng.int(5, 25)).padStart(2, "0")}`;
    specs.push(
      base({
        registeredAt,
        status: "trial",
        plan: "premium",
        trialEndsAt: addDays(registeredAt, 14),
      }),
    );
  }

  const owner: BrokerUser = {
    id: `bu_${p.id}`,
    brokerId: p.id,
    name: p.ownerName,
    email: emailFor(p.ownerName, p.domain),
    phone: "(512) 555-0100",
    role: "owner",
    status: p.loginStatus === "active" ? "active" : "invited",
    lastLoginAt: p.loginStatus === "active" ? "2026-10-20" : null,
  };

  return buildBrokerDataset({
    broker: {
      id: p.id,
      companyName: p.companyName,
      city: p.city,
      status: "active",
      referralCode: p.code,
      referralUrl: `https://client2vendor.com/vendor/register?ref=${p.code}`,
      defaultCommissionRateBps: 3_500,
      loginStatus: p.loginStatus,
      joinedAt: p.joinedAt,
      primaryUserId: owner.id,
      payoutsPaused: p.payoutsPaused ?? false,
    },
    users: [owner],
    agents: generateAgents(
      rng,
      p.id,
      p.domain,
      ["Main Office"],
      p.agentMix,
      "2024-06-01",
      800,
    ),
    vendors: specs,
    fits: [
      {
        vendorKey: specs[0].key,
        date: "2026-09-24",
        targetCommissionCents: p.septemberTargetCents,
        bucket: { from: "2026-09-01", to: "2026-09-30" },
      },
    ],
    lastSettledMonth: "2026-09",
    batchOutcome: p.batchOutcome,
    payoutAccount: { brokerId: p.id, ...p.payoutAccount },
    referralClicksPerRegistration: 4.2,
    invoiceNumberStart: 5001 + p.seed,
    creditNumberStart: 501,
    notifications: () => [],
  });
}

const paidOutcome = (): BatchOutcome => ({
  batchStatus: "finalized",
  transferStatus: "transferred",
  bankPayoutStatus: "paid",
});

export const centuryRealty = makeBroker({
  id: "century-realty",
  companyName: "Century Realty Group",
  city: "Round Rock, TX",
  domain: "centuryrealtygroup.com",
  code: "CENTURY35",
  joinedAt: "2025-12-02",
  loginStatus: "active",
  seed: 101,
  ownerName: "Laura Whitfield",
  premium: 28,
  professional: 3,
  annualInSeptember: "premium",
  startMonths: ["2026-01", "2026-08"],
  nonPaid: { canceled: 4, free: 3, none: 3, trial: 2 },
  septemberTargetCents: 289_000,
  overrideVendor: true,
  batchOutcome: paidOutcome,
  payoutAccount: {
    stripeConnectedAccountId: "acct_demo_1Century",
    onboardingStatus: "connected",
    payoutsEnabled: true,
    requirementsStatus: "No outstanding requirements",
    maskedBankDisplay: "•••• 7710",
    bankName: "Wells Fargo Business",
    connectedAt: "2025-12-10",
    lastStatusSyncAt: "2026-10-28T06:00:00Z",
    payoutSchedule: "Automatic",
  },
  agentMix: { active: 118, inactive: 9, invited: 6 },
});

export const northstarBrokerage = makeBroker({
  id: "northstar",
  companyName: "Northstar Brokerage",
  city: "Phoenix, AZ",
  domain: "northstarbrokerage.com",
  code: "NORTH35",
  joinedAt: "2026-03-09",
  loginStatus: "active",
  seed: 202,
  ownerName: "Marcus Bell",
  premium: 10,
  professional: 0,
  annualInSeptember: "professional",
  startMonths: ["2026-04", "2026-08"],
  nonPaid: { canceled: 2, free: 3, none: 2, trial: 1 },
  septemberTargetCents: 124_000,
  batchOutcome: (month) =>
    month === "2026-09"
      ? {
          batchStatus: "finalized",
          transferStatus: "transferred",
          bankPayoutStatus: "failed",
          failureReason:
            "Bank payout failed: account closed (R02). Stripe returned the funds to the Broker's payout balance.",
        }
      : paidOutcome(),
  payoutAccount: {
    stripeConnectedAccountId: "acct_demo_1Northstr",
    onboardingStatus: "action_required",
    payoutsEnabled: false,
    requirementsStatus: "External bank account must be replaced",
    maskedBankDisplay: "•••• 0093",
    bankName: "Desert Financial CU",
    connectedAt: "2026-03-15",
    lastStatusSyncAt: "2026-10-28T06:00:00Z",
    payoutSchedule: "Automatic (currently disabled by Stripe)",
  },
  agentMix: { active: 61, inactive: 5, invited: 3 },
});

export const metroHomes = makeBroker({
  id: "metro-homes",
  companyName: "Metro Homes",
  city: "Nashville, TN",
  domain: "metrohomes.com",
  code: "METRO35",
  joinedAt: "2026-07-22",
  loginStatus: "invited",
  seed: 303,
  ownerName: "Dana Whitaker",
  premium: 5,
  professional: 2,
  annualInSeptember: "professional",
  startMonths: ["2026-08", "2026-08"],
  nonPaid: { canceled: 0, free: 3, none: 3, trial: 1 },
  septemberTargetCents: 94_000,
  batchOutcome: () => ({
    batchStatus: "on_hold",
    transferStatus: "not_started",
    bankPayoutStatus: "pending",
    holdReason:
      "Payout account not connected. Commission remains owed and will transfer once Stripe setup is complete.",
  }),
  payoutAccount: {
    stripeConnectedAccountId: null,
    onboardingStatus: "not_connected",
    payoutsEnabled: false,
    requirementsStatus: "Stripe onboarding not started",
    maskedBankDisplay: null,
    bankName: null,
    connectedAt: null,
    lastStatusSyncAt: "2026-10-28T06:00:00Z",
    payoutSchedule: "—",
  },
  agentMix: { active: 38, inactive: 2, invited: 4 },
});

export function describeNet(d: BrokerDataset): string {
  const sep = d.payoutBatches.find((b) => b.periodMonth === "2026-09");
  return sep ? formatMoney(sep.netPayoutCents) : "—";
}
