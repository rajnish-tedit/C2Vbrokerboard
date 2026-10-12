import { addDays, formatMonth } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import type {
  BrokerNotification,
  BrokerUser,
  ISODate,
  PlanId,
} from "@/lib/domain/types";

import { generateAgents } from "./agents";
import { buildBrokerDataset, type VendorSpec } from "./engine";
import { CITIES, createNameFactory, TRADES } from "./names";
import { createRng } from "./prng";

const BROKER_ID = "town-square";
const rng = createRng(3535);

const NAMED = {
  lakeside: "Lakeside Pest Control",
  abc: "ABC Plumbing",
  xyz: "XYZ Roofing",
  homeElectric: "Home Electric",
  smith: "Smith HVAC",
  green: "Green Inspection",
  metro: "Metro Cleaning",
  riverbend: "Riverbend Pool Services",
};

const names = createNameFactory(rng, Object.values(NAMED));

function place() {
  return rng.pick(CITIES.slice(0, 5));
}

let counter = 0;
function vendor(
  partial: Omit<
    VendorSpec,
    | "key"
    | "companyName"
    | "trade"
    | "contactName"
    | "city"
    | "state"
    | "taxRateBps"
    | "source"
  > &
    Partial<Pick<VendorSpec, "companyName" | "trade" | "source">>,
): VendorSpec {
  counter += 1;
  const company = partial.companyName
    ? { name: partial.companyName, trade: partial.trade ?? "Services" }
    : names.company(partial.trade);
  const loc = place();
  return {
    key: `ts${String(counter).padStart(3, "0")}`,
    companyName: company.name,
    trade: company.trade,
    contactName: names.person(),
    city: loc.city,
    state: loc.state,
    taxRateBps: loc.taxRateBps,
    source:
      partial.source ?? (rng.next() < 0.7 ? "referral_link" : "promo_code"),
    ...partial,
  };
}

function paid(
  plan: PlanId,
  firstPaidAt: ISODate,
  extra: Partial<VendorSpec> = {},
): VendorSpec {
  return vendor({
    plan,
    billing: "monthly",
    firstPaidAt,
    registeredAt: addDays(firstPaidAt, -rng.int(0, 6)),
    status: "active",
    ...extra,
  });
}

function day(): string {
  return String(rng.int(1, 28)).padStart(2, "0");
}

const specs: VendorSpec[] = [];

// Named Vendors from spec §18.3.
const lakeside = paid("premium", "2025-08-15", {
  companyName: NAMED.lakeside,
  trade: "Pest Control",
  registeredAt: "2025-08-12",
});
const abc = paid("professional", "2026-09-02", {
  companyName: NAMED.abc,
  trade: "Plumbing",
  registeredAt: "2026-09-02",
  source: "referral_link",
  refunds: [
    {
      invoiceDate: "2026-09-02",
      date: "2026-09-18",
      amountCents: 4_000,
      reason: "Partial refund — first-month service credit",
    },
  ],
});
const xyz = paid("premium", "2026-08-10", {
  companyName: NAMED.xyz,
  trade: "Roofing",
  registeredAt: "2026-08-10",
});
const homeElectric = paid("professional", "2026-07-20", {
  companyName: NAMED.homeElectric,
  trade: "Electric",
  registeredAt: "2026-07-20",
});
const smith = paid("premium", "2026-09-13", {
  companyName: NAMED.smith,
  trade: "HVAC",
  registeredAt: "2026-09-13",
  source: "promo_code",
});
const green = vendor({
  companyName: NAMED.green,
  trade: "Home Inspection",
  registeredAt: "2026-09-08",
  status: "none",
});
const metro = paid("professional", "2026-03-14", {
  companyName: NAMED.metro,
  trade: "Cleaning",
  registeredAt: "2026-03-14",
  endAt: "2026-08-20",
  status: "canceled",
});
specs.push(lakeside, abc, xyz, homeElectric, smith, green, metro);

// September new subscribers: 9 Premium + 3 Professional ($2,100) alongside ABC and Smith.
for (let i = 0; i < 12; i++) {
  specs.push(paid(i < 9 ? "premium" : "professional", `2026-09-${day()}`));
}

// Long-running subscribers renewing in September: 36 Premium + 8 Professional ($8,000).
const special: VendorSpec[] = [
  paid("premium", "2026-04-06", {
    endAt: "2026-09-09",
    status: "canceled",
    refunds: [
      {
        invoiceDate: "2026-09-06",
        date: "2026-09-09",
        amountCents: 20_000,
        reason: "Full refund — duplicate subscription created in error",
      },
    ],
  }),
  paid("premium", "2026-02-15", {
    refunds: [
      {
        invoiceDate: "2026-09-15",
        date: "2026-09-20",
        amountCents: 6_000,
        reason: "Partial refund — service credit for platform downtime",
      },
    ],
  }),
  paid("premium", "2026-01-12", { endAt: "2026-10-11", status: "canceled" }),
  paid("professional", "2026-05-24", {
    endAt: "2026-10-23",
    status: "canceled",
  }),
  paid("premium", "2025-12-08", { switchToAnnualAt: "2026-10-08" }),
  paid("premium", "2026-03-17", { switchToAnnualAt: "2026-10-17" }),
];
const startMonths = [
  "2025-11",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-01",
  "2026-02",
  "2026-02",
  "2026-03",
  "2026-03",
  "2026-03",
  "2026-04",
  "2026-04",
  "2026-04",
  "2026-04",
  "2026-05",
  "2026-05",
  "2026-05",
  "2026-05",
  "2026-05",
  "2026-06",
  "2026-06",
  "2026-06",
  "2026-06",
  "2026-06",
  "2026-06",
  "2026-07",
  "2026-07",
  "2026-07",
  "2026-07",
  "2026-07",
  "2026-07",
  "2026-07",
  "2026-08",
  "2026-08",
  "2026-08",
  "2026-08",
  "2026-08",
  "2026-08",
];
const genericPlans: PlanId[] = startMonths.map((_, i) =>
  [3, 9, 16, 22, 27, 33, 36].includes(i) ? "professional" : "premium",
);
specs.push(...special);
startMonths.forEach((month, i) => {
  const firstDay =
    month === "2025-11" ? String(rng.int(10, 28)).padStart(2, "0") : day();
  specs.push(paid(genericPlans[i], `${month}-${firstDay}`));
});

// Annual subscriber, October newcomers, past-due, canceled, expired, trial, free and registered-only.
specs.push(
  paid("professional", "2026-01-12", {
    companyName: NAMED.riverbend,
    trade: "Pool Services",
    billing: "annual",
    registeredAt: "2026-01-09",
  }),
  paid("premium", "2026-10-05", { registeredAt: "2026-10-01" }),
  paid("professional", "2026-10-19", { registeredAt: "2026-10-16" }),
  paid("professional", "2026-05-06", {
    failedFrom: "2026-09-01",
    status: "past_due",
  }),
  paid("professional", "2026-06-16", {
    failedFrom: "2026-09-01",
    status: "past_due",
  }),
  paid("professional", "2026-06-11", {
    endAt: "2026-08-20",
    status: "canceled",
    refunds: [
      {
        invoiceDate: "2026-07-11",
        date: "2026-08-19",
        amountCents: 10_000,
        reason: "Chargeback — cardholder disputed the July charge",
      },
    ],
  }),
  paid("professional", "2026-02-03", {
    endAt: "2026-06-10",
    status: "canceled",
  }),
  paid("starter", "2026-01-20", { endAt: "2026-04-20", status: "expired" }),
  paid("starter", "2026-02-09", { endAt: "2026-05-09", status: "expired" }),
);
(["2026-10-10", "2026-10-18", "2026-10-24"] as ISODate[]).forEach(
  (registeredAt, i) =>
    specs.push(
      vendor({
        registeredAt,
        plan: i === 1 ? "professional" : "premium",
        status: "trial",
        trialEndsAt: addDays(registeredAt, 14),
      }),
    ),
);
(
  [
    "2026-02-18",
    "2026-04-02",
    "2026-05-27",
    "2026-07-08",
    "2026-08-25",
  ] as ISODate[]
).forEach((registeredAt) =>
  specs.push(vendor({ registeredAt, status: "free" })),
);
(["2026-06-19", "2026-08-30", "2026-10-02"] as ISODate[]).forEach(
  (registeredAt) =>
    specs.push(
      vendor({ registeredAt, status: "none", trade: rng.pick(TRADES) }),
    ),
);

const users: BrokerUser[] = [
  {
    id: "bu_michael",
    brokerId: BROKER_ID,
    name: "Michael Carter",
    email: "michael.carter@townsquarerealty.com",
    phone: "(512) 555-0142",
    role: "owner",
    status: "active",
    lastLoginAt: "2026-10-27",
  },
  {
    id: "bu_priya",
    brokerId: BROKER_ID,
    name: "Priya Nair",
    email: "priya.nair@townsquarerealty.com",
    phone: "(512) 555-0178",
    role: "finance",
    status: "active",
    lastLoginAt: "2026-10-21",
  },
  {
    id: "bu_jordan",
    brokerId: BROKER_ID,
    name: "Jordan Lee",
    email: "jordan.lee@townsquarerealty.com",
    phone: "(512) 555-0199",
    role: "viewer",
    status: "not_activated",
    lastLoginAt: null,
  },
];

export const TOWN_SQUARE_VENDOR_KEYS = {
  abc: abc.key,
  xyz: xyz.key,
  homeElectric: homeElectric.key,
  smith: smith.key,
  green: green.key,
  metro: metro.key,
  lakeside: lakeside.key,
};

export const townSquare = buildBrokerDataset({
  broker: {
    id: BROKER_ID,
    companyName: "Town Square Realty",
    city: "Austin, TX",
    status: "active",
    referralCode: "TOWN35",
    referralUrl: "https://client2vendor.com/vendor/register?ref=TOWN35",
    defaultCommissionRateBps: 3_500,
    loginStatus: "active",
    joinedAt: "2025-07-28",
    primaryUserId: "bu_michael",
    payoutsPaused: false,
  },
  users,
  agents: generateAgents(
    rng,
    BROKER_ID,
    "townsquarerealty.com",
    ["Downtown Austin", "Round Rock", "Westlake", "Cedar Park"],
    { active: 212, inactive: 19, invited: 14 },
    "2024-03-01",
    960,
  ),
  vendors: specs,
  fits: [
    {
      vendorKey: special[1].key,
      date: "2026-07-23",
      targetCommissionCents: 294_000,
      bucket: { from: "2026-07-01", to: "2026-07-31" },
    },
    {
      vendorKey: special[1].key,
      date: "2026-08-18",
      targetCommissionCents: 342_000,
      bucket: { from: "2026-08-01", to: "2026-08-31" },
    },
    {
      vendorKey: special[4].key,
      date: "2026-10-14",
      targetCommissionCents: 421_875,
      bucket: { from: "2026-10-01", to: "2026-10-21" },
    },
    {
      vendorKey: special[1].key,
      date: "2026-10-26",
      targetCommissionCents: 127_550,
      bucket: { from: "2026-10-22", to: "2026-10-28" },
    },
  ],
  lastSettledMonth: "2026-09",
  batchOutcome: () => ({
    batchStatus: "finalized",
    transferStatus: "transferred",
    bankPayoutStatus: "paid",
  }),
  payoutAccount: {
    brokerId: BROKER_ID,
    stripeConnectedAccountId: "acct_demo_1TownSq35",
    onboardingStatus: "connected",
    payoutsEnabled: true,
    requirementsStatus: "No outstanding requirements",
    maskedBankDisplay: "•••• 4821",
    bankName: "Chase Business Checking",
    connectedAt: "2025-08-04",
    lastStatusSyncAt: "2026-10-28T06:00:00Z",
    payoutSchedule:
      "Automatic — funds typically arrive 2 business days after transfer",
  },
  referralClicksPerRegistration: 4.6,
  invoiceNumberStart: 1001,
  creditNumberStart: 101,
  notifications: (data) => {
    const batch = (month: string) =>
      data.payoutBatches.find((b) => b.periodMonth === month)!;
    const sep = batch("2026-09");
    const aug = batch("2026-08");
    const abcAdj = data.transactions.find(
      (t) =>
        t.type === "adjustment" && t.vendorId === `v_${BROKER_ID}_${abc.key}`,
    )!;
    const smithId = `v_${BROKER_ID}_${smith.key}`;
    const trialVendor = data.vendors.find(
      (v) => v.registeredAt === "2026-10-24",
    )!;
    const list: BrokerNotification[] = [
      {
        id: "n_ts_trial",
        brokerId: BROKER_ID,
        kind: "new_vendor",
        title: `${trialVendor.companyName} registered with TOWN35`,
        body: "A new Vendor registered through your referral link and started a free trial. Commission starts after their first paid invoice.",
        href: `/broker/vendors/${trialVendor.id}`,
        createdAt: "2026-10-24T15:12:00Z",
      },
      {
        id: "n_ts_sep_bank",
        brokerId: BROKER_ID,
        kind: "bank_paid",
        title: "September payout paid to your bank",
        body: `${formatMoney(sep.netPayoutCents)} was paid to Chase Business Checking •••• 4821.`,
        href: `/broker/payouts/${sep.id}`,
        createdAt: "2026-10-07T14:05:00Z",
      },
      {
        id: "n_ts_sep_transfer",
        brokerId: BROKER_ID,
        kind: "payout_transferred",
        title: "September commission payout processed",
        body: `C2V transferred ${formatMoney(sep.netPayoutCents)} to your Stripe payout account (${sep.stripeTransferReference}).`,
        href: `/broker/payouts/${sep.id}`,
        createdAt: "2026-10-05T10:30:00Z",
      },
      {
        id: "n_ts_sep_statement",
        brokerId: BROKER_ID,
        kind: "statement_ready",
        title: `${formatMonth("2026-09")} statement is ready`,
        body: `Net commission for September: ${formatMoney(sep.netPayoutCents)}.`,
        href: `/broker/payouts/${sep.id}`,
        createdAt: "2026-10-01T09:00:00Z",
      },
      {
        id: "n_ts_abc_adj",
        brokerId: BROKER_ID,
        kind: "commission_adjustment",
        title: "Commission adjustment: ABC Plumbing",
        body: `A $40.00 partial refund created a ${formatMoney(abcAdj.commissionCents)} adjustment. The original $35.00 commission is unchanged.`,
        href: `/broker/commissions?month=2026-09&txn=${abcAdj.id}`,
        createdAt: "2026-09-18T16:40:00Z",
      },
      {
        id: "n_ts_smith",
        brokerId: BROKER_ID,
        kind: "new_vendor",
        title: "Smith HVAC subscribed to Premium",
        body: "Your referred Vendor converted to a paid Premium plan. Commission eligibility runs for 12 months.",
        href: `/broker/vendors/${smithId}`,
        createdAt: "2026-09-13T11:20:00Z",
      },
      {
        id: "n_ts_aug_bank",
        brokerId: BROKER_ID,
        kind: "bank_paid",
        title: "August payout paid to your bank",
        body: `${formatMoney(aug.netPayoutCents)} was paid to Chase Business Checking •••• 4821.`,
        href: `/broker/payouts/${aug.id}`,
        createdAt: "2026-09-07T14:02:00Z",
      },
    ];
    return list;
  },
});
