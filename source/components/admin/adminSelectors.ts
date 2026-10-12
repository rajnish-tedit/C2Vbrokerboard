import { monthSummary, brokerKpis } from "@/lib/domain/selectors";
import type { BrokerDataset, PayoutBatch } from "@/lib/domain/types";

export const SETTLED_MONTH = "2026-09";

export function brokerSummary(d: BrokerDataset) {
  const k = brokerKpis(d);
  const latest = d.payoutBatches[d.payoutBatches.length - 1] ?? null;
  return {
    data: d,
    kpis: k,
    currentCommissionCents: monthSummary(d, SETTLED_MONTH).netCommissionCents,
    latest,
    owedCents: d.payoutBatches
      .filter((b) => b.bankPayoutStatus !== "paid")
      .reduce((s, b) => s + b.netPayoutCents, 0),
  };
}

export type PayoutException = {
  id: string;
  brokerId: string;
  brokerName: string;
  severity: "critical" | "warning";
  title: string;
  detail: string;
  batch: PayoutBatch | null;
  owedCents: number;
  recommended: string;
  kind: "bank_failed" | "on_hold" | "stripe_action";
};

export function payoutExceptions(brokers: BrokerDataset[]): PayoutException[] {
  const out: PayoutException[] = [];
  for (const d of brokers) {
    const failed = d.payoutBatches.filter(
      (b) => b.bankPayoutStatus === "failed",
    );
    for (const batch of failed) {
      out.push({
        id: `ex_${batch.id}`,
        brokerId: d.broker.id,
        brokerName: d.broker.companyName,
        severity: "critical",
        title: "Bank payout failed after successful transfer",
        detail: batch.failureReason ?? "Bank rejected the payout.",
        batch,
        owedCents: batch.netPayoutCents,
        recommended:
          "Broker must replace the external bank account in Stripe. Stripe retries the payout automatically once updated. Do not recalculate commission.",
        kind: "bank_failed",
      });
    }
    const held = d.payoutBatches.filter((b) => b.batchStatus === "on_hold");
    if (held.length) {
      out.push({
        id: `ex_hold_${d.broker.id}`,
        brokerId: d.broker.id,
        brokerName: d.broker.companyName,
        severity: "warning",
        title: `${held.length} payout batch${held.length > 1 ? "es" : ""} on hold: payout account not connected`,
        detail: held[0].holdReason ?? "Payout account not connected.",
        batch: held[held.length - 1],
        owedCents: held.reduce((s, b) => s + b.netPayoutCents, 0),
        recommended:
          "Resend the Broker invitation and Stripe setup link. Batches transfer automatically after onboarding.",
        kind: "on_hold",
      });
    }
    if (
      !failed.length &&
      !held.length &&
      d.payoutAccount.onboardingStatus !== "connected"
    ) {
      out.push({
        id: `ex_stripe_${d.broker.id}`,
        brokerId: d.broker.id,
        brokerName: d.broker.companyName,
        severity: "warning",
        title: "Stripe account needs attention",
        detail: d.payoutAccount.requirementsStatus,
        batch: null,
        owedCents: 0,
        recommended:
          "Ask the Broker to complete Stripe requirements before the next settlement (Nov 05).",
        kind: "stripe_action",
      });
    }
  }
  return out.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1,
  );
}
