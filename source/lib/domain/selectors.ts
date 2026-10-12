import { addMonths, monthKey, monthRange, shiftMonth } from "./dates";
import type { DemoState } from "./demo";
import { sum } from "./money";
import { DEMO_TODAY } from "./policy";
import { referralStatusFor, type ReferralStatus } from "./status";
import type {
  BrokerDataset,
  BrokerNotification,
  BrokerPayoutAccount,
  Cents,
  CommissionTransaction,
  Invoice,
  MonthKey,
  PayoutBatch,
  StripeSetupStatus,
  Vendor,
  BrokerVendorReferral,
  VendorSubscriptionSnapshot,
} from "./types";

export const CURRENT_MONTH: MonthKey = monthKey(DEMO_TODAY);
export const FAILED_PAYOUT_MONTH: MonthKey = "2026-09";
export const FAILED_PAYOUT_REASON =
  "Your bank rejected the payout (account closed, R02). Stripe returned the funds to your payout balance. Update your bank account in Stripe to receive this payout.";

function payoutAccountFor(
  account: BrokerPayoutAccount,
  status: StripeSetupStatus,
): BrokerPayoutAccount {
  if (status === account.onboardingStatus) return account;
  const hasBank =
    status === "connected" ||
    status === "action_required" ||
    status === "under_review";
  const requirements: Record<StripeSetupStatus, string> = {
    not_connected: "Stripe onboarding not started",
    incomplete: "Business details and bank account still required",
    under_review:
      "Stripe is verifying identity documents (usually 1–2 business days)",
    connected: "No outstanding requirements",
    action_required:
      "Bank account rejected a payout — add a new external bank account",
  };
  return {
    ...account,
    onboardingStatus: status,
    payoutsEnabled: status === "connected",
    requirementsStatus: requirements[status],
    stripeConnectedAccountId:
      status === "not_connected"
        ? null
        : (account.stripeConnectedAccountId ?? "acct_demo_new"),
    maskedBankDisplay: hasBank
      ? (account.maskedBankDisplay ?? "•••• 4821")
      : null,
    bankName: hasBank ? (account.bankName ?? "Chase Business Checking") : null,
    connectedAt: hasBank ? account.connectedAt : null,
  };
}

function emptyBroker(d: BrokerDataset): BrokerDataset {
  return {
    ...d,
    agents: [],
    vendors: [],
    referrals: [],
    subscriptions: [],
    invoices: [],
    credits: [],
    transactions: [],
    payoutBatches: [],
    notifications: [],
    referralActivity: d.referralActivity.map((a) => ({
      ...a,
      linkClicks: 0,
      registrations: 0,
      paidConversions: 0,
    })),
    payoutAccount: payoutAccountFor(d.payoutAccount, "not_connected"),
  };
}

function regCode(company: string): string {
  const letters = company.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "BRKR";
  return `${letters}35`;
}

export function applyDemoState(
  d: BrokerDataset,
  demo: DemoState,
): BrokerDataset {
  const paused = demo.pausedBrokerIds.includes(d.broker.id);
  let data: BrokerDataset = paused
    ? { ...d, broker: { ...d.broker, payoutsPaused: true } }
    : d;
  if (d.broker.id !== "town-square") return data;

  if (demo.previewNewBroker) data = emptyBroker(data);
  if (demo.registration)
    data = {
      ...data,
      broker: {
        ...data.broker,
        companyName: demo.registration.company,
        referralCode: regCode(demo.registration.company),
        referralUrl: `https://client2vendor.com/vendor/register?ref=${regCode(demo.registration.company)}`,
        city: `${demo.registration.city}, ${demo.registration.state}`,
      },
    };
  if (demo.invitedAgents?.length)
    data = { ...data, agents: [...demo.invitedAgents, ...data.agents] };
  const stripeStatus = demo.previewNewBroker
    ? "not_connected"
    : demo.stripeStatus;
  data = {
    ...data,
    payoutAccount: payoutAccountFor(data.payoutAccount, stripeStatus),
  };

  const notifications: BrokerNotification[] = [];
  if (demo.bankPayoutFailed && !demo.previewNewBroker) {
    const batch = data.payoutBatches.find(
      (b) => b.periodMonth === FAILED_PAYOUT_MONTH,
    );
    if (batch) {
      const failedBatch: PayoutBatch = {
        ...batch,
        bankPayoutStatus: "failed",
        bankPaidAt: null,
        failureReason: FAILED_PAYOUT_REASON,
      };
      const ids = new Set(batch.transactionIds);
      data = {
        ...data,
        payoutBatches: data.payoutBatches.map((b) =>
          b.id === batch.id ? failedBatch : b,
        ),
        transactions: data.transactions.map((t) =>
          ids.has(t.id) && t.status === "paid"
            ? { ...t, status: "transferred" }
            : t,
        ),
        notifications: data.notifications.filter(
          (n) => n.id !== "n_ts_sep_bank",
        ),
      };
      notifications.push({
        id: "n_ts_payout_failed",
        brokerId: d.broker.id,
        kind: "payout_failed",
        title: "Action required: September bank payout failed",
        body: "Your commission was calculated and transferred correctly, but your bank rejected the payout. Update your payout account to receive it.",
        href: "/broker/payout-settings",
        createdAt: "2026-10-07T13:11:00Z",
      });
    }
  }
  if (stripeStatus !== "connected" && stripeStatus !== "under_review") {
    notifications.push({
      id: `n_ts_stripe_${stripeStatus}`,
      brokerId: d.broker.id,
      kind: "stripe_setup",
      title:
        stripeStatus === "action_required"
          ? "Update your Stripe payout account"
          : "Complete payout account setup",
      body: "Complete payout account setup to receive C2V commission payments. Your commission keeps accruing in the meantime.",
      href: "/broker/payout-settings",
      createdAt: "2026-10-28T08:00:00Z",
    });
  }
  return { ...data, notifications: [...notifications, ...data.notifications] };
}

export type VendorRow = {
  vendor: Vendor;
  referral: BrokerVendorReferral;
  subscription: VendorSubscriptionSnapshot;
  referralStatus: ReferralStatus;
  lifetimeEligibleRevenueCents: Cents;
  lifetimeCommissionCents: Cents;
  lastPaymentAt: string | null;
};

export function vendorRows(d: BrokerDataset): VendorRow[] {
  return d.vendors
    .map((vendor) => {
      const subscription = d.subscriptions.find(
        (s) => s.vendorId === vendor.id,
      )!;
      const referral = d.referrals.find((r) => r.vendorId === vendor.id)!;
      const txns = d.transactions.filter((t) => t.vendorId === vendor.id);
      const paidInvoices = d.invoices.filter(
        (i) => i.vendorId === vendor.id && i.paymentStatus !== "failed",
      );
      return {
        vendor,
        referral,
        subscription,
        referralStatus: referralStatusFor(subscription.status),
        lifetimeEligibleRevenueCents: sum(
          txns.map((t) => t.eligibleAmountCents),
        ),
        lifetimeCommissionCents: sum(txns.map((t) => t.commissionCents)),
        lastPaymentAt: paidInvoices[paidInvoices.length - 1]?.date ?? null,
      };
    })
    .sort((a, b) => b.vendor.registeredAt.localeCompare(a.vendor.registeredAt));
}

export function openTransactions(d: BrokerDataset): CommissionTransaction[] {
  return d.transactions.filter(
    (t) => !t.payoutBatchId && t.status !== "not_eligible",
  );
}

export function latestBatch(d: BrokerDataset): PayoutBatch | undefined {
  return d.payoutBatches[d.payoutBatches.length - 1];
}

export function brokerKpis(d: BrokerDataset) {
  const open = openTransactions(d);
  const last = latestBatch(d);
  return {
    connectedAgents: d.agents.length,
    activeAgents: d.agents.filter((a) => a.status === "active").length,
    referredVendors: d.vendors.length,
    activePaidVendors: d.subscriptions.filter(
      (s) => s.status === "active" && s.planId,
    ).length,
    pendingCommissionCents: sum(
      open.filter((t) => t.status === "pending").map((t) => t.commissionCents),
    ),
    availableForPayoutCents: sum(
      open.filter((t) => t.status === "eligible").map((t) => t.commissionCents),
    ),
    lastPayout: last,
    nextSettlementDate: `${shiftMonth(CURRENT_MONTH, 1)}-05`,
  };
}

export type MonthSummary = {
  month: MonthKey;
  batch: PayoutBatch | null;
  subscriptionRevenueCents: Cents;
  eligibleRevenueCents: Cents;
  newCommissionCents: Cents;
  renewalCommissionCents: Cents;
  grossCommissionCents: Cents;
  adjustmentsCents: Cents;
  netCommissionCents: Cents;
  rateBps: number;
  transactions: CommissionTransaction[];
};

function invoicesInMonth(d: BrokerDataset, month: MonthKey): Invoice[] {
  return d.invoices.filter(
    (i) => monthKey(i.date) === month && i.paymentStatus !== "failed",
  );
}

export function monthSummary(d: BrokerDataset, month: MonthKey): MonthSummary {
  const batch = d.payoutBatches.find((b) => b.periodMonth === month) ?? null;
  const transactions = d.transactions.filter((t) => t.periodMonth === month);
  const positive = transactions.filter((t) => t.type !== "adjustment");
  const byType = (type: CommissionTransaction["type"]) =>
    sum(
      transactions.filter((t) => t.type === type).map((t) => t.commissionCents),
    );
  return {
    month,
    batch,
    subscriptionRevenueCents: sum(
      invoicesInMonth(d, month).map((i) => i.amountCents),
    ),
    eligibleRevenueCents: sum(positive.map((t) => t.eligibleAmountCents)),
    newCommissionCents: byType("new"),
    renewalCommissionCents: byType("renewal"),
    grossCommissionCents: sum(positive.map((t) => t.commissionCents)),
    adjustmentsCents: byType("adjustment"),
    netCommissionCents: sum(transactions.map((t) => t.commissionCents)),
    rateBps: d.broker.defaultCommissionRateBps,
    transactions,
  };
}

export function commissionMonths(d: BrokerDataset): MonthKey[] {
  const first = d.transactions[0]?.periodMonth ?? CURRENT_MONTH;
  return monthRange(first, CURRENT_MONTH).reverse();
}

export function recentMonths(
  count: number,
  end: MonthKey = CURRENT_MONTH,
): MonthKey[] {
  return monthRange(shiftMonth(end, -(count - 1)), end);
}

export function monthlyCommissionSeries(d: BrokerDataset, months: MonthKey[]) {
  return months.map((month) => {
    const s = monthSummary(d, month);
    return {
      month,
      netCents: s.netCommissionCents,
      grossCents: s.grossCommissionCents,
      newRevenueCents: sum(
        s.transactions
          .filter((t) => t.type === "new")
          .map((t) => t.eligibleAmountCents),
      ),
      renewalRevenueCents: sum(
        s.transactions
          .filter((t) => t.type === "renewal")
          .map((t) => t.eligibleAmountCents),
      ),
      inProgress: !s.batch,
    };
  });
}

export function referralFunnel(d: BrokerDataset) {
  return {
    linkClicks: sum(d.referralActivity.map((a) => a.linkClicks)),
    registrations: d.vendors.length,
    paidConversions: d.subscriptions.filter((s) => s.firstPaidAt).length,
    activePaid: d.subscriptions.filter((s) => s.status === "active" && s.planId)
      .length,
  };
}

export function eligibilityStatus(
  referral: BrokerVendorReferral,
): "active" | "ended" | "not_started" {
  if (!referral.commissionStartAt || !referral.commissionEndAt)
    return "not_started";
  return DEMO_TODAY > referral.commissionEndAt ? "ended" : "active";
}

export function commissionWindowMonthsLeft(
  referral: BrokerVendorReferral,
): number | null {
  if (!referral.commissionStartAt) return null;
  let months = 0;
  let cursor = DEMO_TODAY;
  const end = referral.commissionEndAt!;
  while (addMonths(cursor, 1) <= end) {
    cursor = addMonths(cursor, 1);
    months++;
  }
  return months;
}
