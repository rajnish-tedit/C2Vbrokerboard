import {
  addDays,
  addMonths,
  monthEnd,
  monthKey,
  monthRange,
  monthStart,
  shiftMonth,
} from "@/lib/domain/dates";
import { commissionFor, sum } from "@/lib/domain/money";
import { COMMISSION_POLICY, DEMO_TODAY, PLANS } from "@/lib/domain/policy";
import type {
  Agent,
  AttributionSource,
  BankPayoutStatus,
  BatchStatus,
  BillingFrequency,
  Broker,
  BrokerDataset,
  BrokerNotification,
  BrokerPayoutAccount,
  BrokerUser,
  BrokerVendorReferral,
  Cents,
  CommissionStatus,
  CommissionTransaction,
  Credit,
  ISODate,
  Invoice,
  InvoiceKind,
  MonthKey,
  PayoutBatch,
  PlanId,
  ReferralActivity,
  SubscriptionStatus,
  TransferStatus,
  Vendor,
  VendorSubscriptionSnapshot,
} from "@/lib/domain/types";

export type RefundSpec = {
  invoiceDate: ISODate;
  date: ISODate;
  amountCents: Cents;
  reason: string;
};

export type VendorSpec = {
  key: string;
  companyName: string;
  trade: string;
  contactName: string;
  city: string;
  state: string;
  taxRateBps: number;
  registeredAt: ISODate;
  source: AttributionSource;
  status: SubscriptionStatus;
  plan?: PlanId;
  billing?: BillingFrequency;
  firstPaidAt?: ISODate;
  endAt?: ISODate;
  failedFrom?: ISODate;
  switchToAnnualAt?: ISODate;
  refunds?: RefundSpec[];
  trialEndsAt?: ISODate;
};

export type FitSpec = {
  vendorKey: string;
  date: ISODate;
  targetCommissionCents: Cents;
  bucket: { from: ISODate; to: ISODate };
};

export type BatchOutcome = {
  batchStatus: BatchStatus;
  transferStatus: TransferStatus;
  bankPayoutStatus: BankPayoutStatus;
  failureReason?: string;
  holdReason?: string;
};

export type BrokerBuildConfig = {
  broker: Broker;
  users: BrokerUser[];
  agents: Agent[];
  vendors: VendorSpec[];
  fits: FitSpec[];
  lastSettledMonth: MonthKey;
  batchOutcome: (month: MonthKey) => BatchOutcome;
  payoutAccount: BrokerPayoutAccount;
  referralClicksPerRegistration: number;
  invoiceNumberStart: number;
  creditNumberStart: number;
  notifications: (
    dataset: Omit<BrokerDataset, "notifications">,
  ) => BrokerNotification[];
};

type RawInvoice = Omit<
  Invoice,
  "id" | "number" | "recurlyInvoiceId" | "paymentReference"
> & {
  vendorKey: string;
};

const RATE = COMMISSION_POLICY.rateBps;

export function amountForCommission(
  targetCents: Cents,
  rateBps: number,
): Cents {
  let amount = Math.round((targetCents * 10_000) / rateBps);
  for (
    let i = 0;
    i < 10 && commissionFor(amount, rateBps) !== targetCents;
    i++
  ) {
    amount += commissionFor(amount, rateBps) < targetCents ? 1 : -1;
  }
  if (commissionFor(amount, rateBps) !== targetCents) {
    throw new Error(`Cannot solve amount for ${targetCents}`);
  }
  return amount;
}

function eligibilityEnd(firstPaidAt: ISODate): ISODate {
  return addMonths(firstPaidAt, COMMISSION_POLICY.eligibilityMonths);
}

function tax(amount: Cents, taxRateBps: number): Cents {
  return Math.round((amount * taxRateBps) / 10_000);
}

function generateInvoices(spec: VendorSpec, brokerId: string): RawInvoice[] {
  if (!spec.plan || !spec.firstPaidAt || !spec.billing) return [];
  const plan = PLANS[spec.plan];
  const invoices: RawInvoice[] = [];
  let date = spec.firstPaidAt;
  let billing: BillingFrequency = spec.billing;
  let first = true;

  while (date <= DEMO_TODAY && (!spec.endAt || date < spec.endAt)) {
    if (spec.switchToAnnualAt && date >= spec.switchToAnnualAt)
      billing = "annual";
    const price =
      billing === "annual" ? plan.annualPriceCents : plan.monthlyPriceCents;
    const failed = Boolean(spec.failedFrom && date >= spec.failedFrom);
    const kind: InvoiceKind = first ? "new" : "renewal";
    const switched = spec.switchToAnnualAt === date;
    invoices.push({
      vendorKey: spec.key,
      brokerId,
      vendorId: "",
      date,
      planId: plan.id,
      billingFrequency: billing,
      kind,
      description: switched
        ? `${plan.name} — switched to annual billing`
        : `${plan.name} ${billing === "annual" ? "annual" : "monthly"} subscription`,
      listPriceCents: price,
      discountCents: 0,
      amountCents: price,
      taxCents: tax(price, spec.taxRateBps),
      chargedCents: price + tax(price, spec.taxRateBps),
      paymentStatus: failed ? "failed" : "paid",
      refundedCents: 0,
    });
    first = false;
    date = addMonths(date, billing === "annual" ? 12 : 1);
  }
  return invoices;
}

export function buildBrokerDataset(config: BrokerBuildConfig): BrokerDataset {
  const { broker } = config;
  const bid = broker.id;

  const vendors: Vendor[] = [];
  const referrals: BrokerVendorReferral[] = [];
  const specByKey = new Map<string, VendorSpec>();
  const vendorIdByKey = new Map<string, string>();

  config.vendors.forEach((spec) => {
    const vendorId = `v_${bid}_${spec.key}`;
    specByKey.set(spec.key, spec);
    vendorIdByKey.set(spec.key, vendorId);
    vendors.push({
      id: vendorId,
      companyName: spec.companyName,
      trade: spec.trade,
      contactName: spec.contactName,
      city: spec.city,
      state: spec.state,
      registeredAt: spec.registeredAt,
      taxRateBps: spec.taxRateBps,
    });
    referrals.push({
      id: `ref_${bid}_${spec.key}`,
      brokerId: bid,
      vendorId,
      promoCode: broker.referralCode,
      attributionSource: spec.source,
      referredAt: spec.registeredAt,
      commissionRateBps: broker.defaultCommissionRateBps,
      commissionStartAt: spec.firstPaidAt ?? null,
      commissionEndAt: spec.firstPaidAt
        ? addDays(eligibilityEnd(spec.firstPaidAt), -1)
        : null,
      status: spec.source === "admin_override" ? "overridden" : "attributed",
    });
  });

  // 1. Base invoices from subscription schedules.
  const raw: RawInvoice[] = config.vendors.flatMap((spec) =>
    generateInvoices(spec, bid),
  );

  // 2. Calibration invoices: prorated mid-cycle upgrades that close each bucket to its target.
  for (const fit of config.fits) {
    const spec = specByKey.get(fit.vendorKey);
    if (!spec?.firstPaidAt || !spec.plan)
      throw new Error(`Bad fit vendor ${fit.vendorKey}`);
    const base = sum(
      raw
        .filter(
          (inv) =>
            inv.paymentStatus === "paid" &&
            inv.date >= fit.bucket.from &&
            inv.date <= fit.bucket.to &&
            inv.date <
              eligibilityEnd(specByKey.get(inv.vendorKey)!.firstPaidAt!),
        )
        .map((inv) => commissionFor(inv.amountCents, RATE)),
    );
    const residual = fit.targetCommissionCents - base;
    if (residual <= 0) {
      throw new Error(
        `Fit for ${bid} ${fit.bucket.from}..${fit.bucket.to} is ${residual}`,
      );
    }
    const amount = amountForCommission(residual, RATE);
    raw.push({
      vendorKey: spec.key,
      brokerId: bid,
      vendorId: "",
      date: fit.date,
      planId: "premium",
      billingFrequency: "monthly",
      kind: "upgrade_proration",
      description: "Prorated mid-cycle upgrade (additional seats)",
      listPriceCents: amount,
      discountCents: 0,
      amountCents: amount,
      taxCents: tax(amount, spec.taxRateBps),
      chargedCents: amount + tax(amount, spec.taxRateBps),
      paymentStatus: "paid",
      refundedCents: 0,
    });
  }

  raw.sort((a, b) =>
    a.date === b.date
      ? a.vendorKey.localeCompare(b.vendorKey)
      : a.date.localeCompare(b.date),
  );

  const invoices: Invoice[] = raw.map((inv, index) => {
    const number = config.invoiceNumberStart + index;
    const { vendorKey, ...rest } = inv;
    return {
      ...rest,
      id: `inv_${bid}_${number}`,
      number: `INV-${number}`,
      vendorId: vendorIdByKey.get(vendorKey)!,
      recurlyInvoiceId: `rc_inv_${bid.slice(0, 3)}${number}`,
      paymentReference:
        inv.paymentStatus === "paid"
          ? `ch_demo_${bid.slice(0, 3)}_${number}`
          : null,
    };
  });

  // 3. Credits (refunds) against specific invoices.
  const credits: Credit[] = [];
  let creditNumber = config.creditNumberStart;
  for (const spec of config.vendors) {
    for (const refund of spec.refunds ?? []) {
      const invoice = invoices.find(
        (inv) =>
          inv.vendorId === vendorIdByKey.get(spec.key) &&
          inv.date === refund.invoiceDate &&
          inv.kind !== "upgrade_proration",
      );
      if (!invoice)
        throw new Error(
          `No invoice for refund ${spec.key} ${refund.invoiceDate}`,
        );
      invoice.refundedCents += refund.amountCents;
      invoice.paymentStatus =
        invoice.refundedCents >= invoice.amountCents
          ? "refunded"
          : "partially_refunded";
      credits.push({
        id: `cr_${bid}_${creditNumber}`,
        number: `CR-${creditNumber}`,
        brokerId: bid,
        vendorId: invoice.vendorId,
        invoiceId: invoice.id,
        date: refund.date,
        amountCents: refund.amountCents,
        reason: refund.reason,
        kind:
          refund.amountCents >= invoice.amountCents
            ? "refund"
            : "partial_refund",
      });
      creditNumber++;
    }
  }
  credits.sort((a, b) => a.date.localeCompare(b.date));

  // 4. Immutable commission ledger.
  const transactions: CommissionTransaction[] = [];
  const firstPaidByVendor = new Map<string, ISODate>();
  config.vendors.forEach((s) => {
    if (s.firstPaidAt)
      firstPaidByVendor.set(vendorIdByKey.get(s.key)!, s.firstPaidAt);
  });

  let seq = 1;
  const txnByInvoice = new Map<string, CommissionTransaction>();
  for (const inv of invoices) {
    if (inv.paymentStatus === "failed") continue;
    const firstPaid = firstPaidByVendor.get(inv.vendorId)!;
    const inWindow = inv.date < eligibilityEnd(firstPaid);
    const txn: CommissionTransaction = {
      id: `ct_${bid}_${String(seq++).padStart(4, "0")}`,
      brokerId: bid,
      vendorId: inv.vendorId,
      subscriptionId: `sub_${inv.vendorId}`,
      invoiceId: inv.id,
      creditId: null,
      relatedTransactionId: null,
      reference: inv.number,
      paymentReference: inv.paymentReference,
      type: inv.kind === "new" ? "new" : "renewal",
      planId: inv.planId,
      eligibleAmountCents: inWindow ? inv.amountCents : 0,
      rateBps: RATE,
      commissionCents: inWindow ? commissionFor(inv.amountCents, RATE) : 0,
      status: "pending",
      adjustmentFlag: null,
      ineligibleReason: inWindow
        ? null
        : `Outside 12-month commission period (ended ${addDays(eligibilityEnd(firstPaid), -1)})`,
      earnedAt: inv.date,
      eligibleAt: addDays(inv.date, COMMISSION_POLICY.holdDays),
      periodMonth: monthKey(inv.date),
      payoutBatchId: null,
      carriedForward: false,
    };
    transactions.push(txn);
    txnByInvoice.set(inv.id, txn);
  }

  for (const credit of credits) {
    const original = txnByInvoice.get(credit.invoiceId);
    if (!original || original.commissionCents === 0) continue;
    original.adjustmentFlag =
      credit.kind === "refund" ? "reversed" : "adjusted";
    const period = monthKey(credit.date);
    transactions.push({
      id: `ct_${bid}_${String(seq++).padStart(4, "0")}`,
      brokerId: bid,
      vendorId: credit.vendorId,
      subscriptionId: original.subscriptionId,
      invoiceId: credit.invoiceId,
      creditId: credit.id,
      relatedTransactionId: original.id,
      reference: credit.number,
      paymentReference: original.paymentReference,
      type: "adjustment",
      planId: original.planId,
      eligibleAmountCents: -credit.amountCents,
      rateBps: RATE,
      commissionCents: commissionFor(-credit.amountCents, RATE),
      status: "pending",
      adjustmentFlag: null,
      ineligibleReason: null,
      earnedAt: credit.date,
      eligibleAt: credit.date,
      periodMonth: period,
      payoutBatchId: null,
      carriedForward: period > original.periodMonth,
    });
  }
  transactions.sort((a, b) =>
    a.earnedAt === b.earnedAt
      ? a.id.localeCompare(b.id)
      : a.earnedAt.localeCompare(b.earnedAt),
  );

  // 5. Monthly settlement batches.
  const payoutBatches: PayoutBatch[] = [];
  const firstMonth = transactions[0]?.periodMonth;
  if (firstMonth) {
    for (const month of monthRange(firstMonth, config.lastSettledMonth)) {
      const rows = transactions.filter((t) => t.periodMonth === month);
      if (rows.length === 0) continue;
      const outcome = config.batchOutcome(month);
      const next = shiftMonth(month, 1);
      const settlementDate = `${next}-${String(COMMISSION_POLICY.settlementDay).padStart(2, "0")}`;
      const bankDate = addDays(
        settlementDate,
        COMMISSION_POLICY.bankPayoutLagDays,
      );
      const monthInvoices = invoices.filter(
        (inv) => monthKey(inv.date) === month && inv.paymentStatus !== "failed",
      );
      const positive = rows.filter((r) => r.type !== "adjustment");
      const batchId = `po_${bid}_${month.replace("-", "_")}`;
      const transferred = outcome.transferStatus === "transferred";
      const monName = new Date(`${month}-01T00:00:00Z`)
        .toLocaleString("en-US", { month: "short", timeZone: "UTC" })
        .toLowerCase();
      const batch: PayoutBatch = {
        id: batchId,
        brokerId: bid,
        periodMonth: month,
        periodStart: monthStart(month),
        periodEnd: monthEnd(month),
        settlementCutoffAt: `${next}-01`,
        subscriptionRevenueCents: sum(monthInvoices.map((i) => i.amountCents)),
        eligibleRevenueCents: sum(positive.map((r) => r.eligibleAmountCents)),
        newCommissionCents: sum(
          rows.filter((r) => r.type === "new").map((r) => r.commissionCents),
        ),
        renewalCommissionCents: sum(
          rows
            .filter((r) => r.type === "renewal")
            .map((r) => r.commissionCents),
        ),
        grossCommissionCents: sum(positive.map((r) => r.commissionCents)),
        adjustmentsCents: sum(
          rows
            .filter((r) => r.type === "adjustment")
            .map((r) => r.commissionCents),
        ),
        netPayoutCents: sum(rows.map((r) => r.commissionCents)),
        batchStatus: outcome.batchStatus,
        transferStatus: outcome.transferStatus,
        stripeTransferReference: transferred
          ? `tr_demo_${monName}_${month.slice(0, 4)}${bid === "town-square" ? "" : `_${bid.slice(0, 5)}`}`
          : null,
        transferredAt: transferred ? settlementDate : null,
        bankPayoutStatus: outcome.bankPayoutStatus,
        bankPayoutReference:
          transferred && outcome.bankPayoutStatus !== "pending"
            ? `po_demo_${monName}_${month.slice(0, 4)}`
            : null,
        bankPaidAt: outcome.bankPayoutStatus === "paid" ? bankDate : null,
        bankPayoutExpectedAt: transferred ? bankDate : null,
        failureReason: outcome.failureReason ?? null,
        holdReason: outcome.holdReason ?? null,
        transactionIds: rows.map((r) => r.id),
      };
      payoutBatches.push(batch);
      const status: CommissionStatus =
        outcome.bankPayoutStatus === "paid"
          ? "paid"
          : transferred
            ? "transferred"
            : "included_in_payout";
      rows.forEach((r) => {
        r.payoutBatchId = batchId;
        if (r.ineligibleReason === null) r.status = status;
      });
    }
  }
  transactions.forEach((t) => {
    if (t.ineligibleReason !== null) t.status = "not_eligible";
    else if (!t.payoutBatchId)
      t.status = DEMO_TODAY < t.eligibleAt ? "pending" : "eligible";
  });

  // 6. Subscription snapshots.
  const subscriptions: VendorSubscriptionSnapshot[] = config.vendors.map(
    (spec) => {
      const vendorId = vendorIdByKey.get(spec.key)!;
      const vendorInvoices = invoices.filter(
        (i) => i.vendorId === vendorId && i.kind !== "upgrade_proration",
      );
      const last = vendorInvoices[vendorInvoices.length - 1];
      const billing =
        spec.switchToAnnualAt && spec.switchToAnnualAt <= DEMO_TODAY
          ? "annual"
          : (spec.billing ?? null);
      return {
        vendorId,
        recurlyAccountId: `rc_acct_${spec.key}`,
        subscriptionId: spec.plan ? `sub_${vendorId}` : null,
        planId: spec.plan ?? null,
        billingFrequency: billing,
        status: spec.status,
        firstPaidAt: spec.firstPaidAt ?? null,
        canceledAt: spec.endAt ?? null,
        currentPeriodEndsAt:
          last && (spec.status === "active" || spec.status === "past_due")
            ? addDays(
                addMonths(
                  last.date,
                  last.billingFrequency === "annual" ? 12 : 1,
                ),
                -1,
              )
            : null,
        trialEndsAt: spec.trialEndsAt ?? null,
      };
    },
  );

  // 7. Referral funnel activity per month.
  const firstReg =
    config.vendors.map((v) => v.registeredAt).sort()[0] ?? DEMO_TODAY;
  const referralActivity: ReferralActivity[] = monthRange(
    monthKey(firstReg),
    monthKey(DEMO_TODAY),
  ).map((month, index) => {
    const registrations = config.vendors.filter(
      (v) => monthKey(v.registeredAt) === month,
    ).length;
    const paidConversions = config.vendors.filter(
      (v) => v.firstPaidAt && monthKey(v.firstPaidAt) === month,
    ).length;
    return {
      month,
      registrations,
      paidConversions,
      linkClicks:
        Math.round(registrations * config.referralClicksPerRegistration) +
        (index % 3) * 2,
    };
  });

  const partial: Omit<BrokerDataset, "notifications"> = {
    broker,
    users: config.users,
    agents: config.agents,
    vendors,
    referrals,
    subscriptions,
    invoices,
    credits,
    transactions,
    payoutBatches,
    payoutAccount: config.payoutAccount,
    referralActivity,
  };
  return { ...partial, notifications: config.notifications(partial) };
}
