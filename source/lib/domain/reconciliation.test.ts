import { describe, expect, it } from "vitest";

import { BROKER_DATASETS } from "@/lib/mock";
import { townSquare } from "@/lib/mock/townSquare";

import { INITIAL_DEMO_STATE } from "./demo";
import { commissionFor, dollars, sum } from "./money";
import { applyDemoState, brokerKpis, monthSummary } from "./selectors";

describe("Town Square demo data matches the specification", () => {
  it("September 2026 summary (§8.2, §18.2)", () => {
    const s = monthSummary(townSquare, "2026-09");
    expect(s.subscriptionRevenueCents).toBe(dollars(10_900));
    expect(s.eligibleRevenueCents).toBe(dollars(10_700));
    expect(s.grossCommissionCents).toBe(dollars(3_745));
    expect(s.newCommissionCents).toBe(dollars(840));
    expect(s.renewalCommissionCents).toBe(dollars(2_905));
    expect(s.adjustmentsCents).toBe(dollars(-105));
    expect(s.netCommissionCents).toBe(dollars(3_640));
    expect(s.batch?.netPayoutCents).toBe(dollars(3_640));
    expect(s.batch?.transferredAt).toBe("2026-10-05");
    expect(s.batch?.bankPaidAt).toBe("2026-10-07");
    expect(s.batch?.stripeTransferReference).toBe("tr_demo_sep_2026");
  });

  it("payout list (§9.1)", () => {
    const expected: Record<string, [number, number, number]> = {
      "2026-07": [2_940, 0, 2_940],
      "2026-08": [3_420, -35, 3_385],
      "2026-09": [3_745, -105, 3_640],
    };
    for (const [month, [gross, adj, net]] of Object.entries(expected)) {
      const batch = townSquare.payoutBatches.find(
        (b) => b.periodMonth === month,
      )!;
      expect([
        batch.grossCommissionCents,
        batch.adjustmentsCents,
        batch.netPayoutCents,
      ]).toEqual([dollars(gross), dollars(adj), dollars(net)]);
      expect(batch.bankPayoutStatus).toBe("paid");
    }
  });

  it("dashboard KPIs (§7.2)", () => {
    const k = brokerKpis(applyDemoState(townSquare, INITIAL_DEMO_STATE));
    expect(k.connectedAgents).toBe(245);
    expect(k.referredVendors).toBe(83);
    expect(k.activePaidVendors).toBe(61);
    expect(k.pendingCommissionCents).toBe(dollars(1_275.5));
    expect(k.availableForPayoutCents).toBe(dollars(4_218.75));
    expect(k.lastPayout?.netPayoutCents).toBe(dollars(3_640));
  });

  it("ABC Plumbing: original commission kept, refund is a separate negative entry (§12.1)", () => {
    const abc = townSquare.vendors.find(
      (v) => v.companyName === "ABC Plumbing",
    )!;
    const rows = townSquare.transactions.filter(
      (t) => t.vendorId === abc.id && t.periodMonth === "2026-09",
    );
    const original = rows.find((t) => t.type === "new")!;
    const adjustment = rows.find((t) => t.type === "adjustment")!;
    expect(original.commissionCents).toBe(dollars(35));
    expect(original.adjustmentFlag).toBe("adjusted");
    expect(adjustment.commissionCents).toBe(dollars(-14));
    expect(adjustment.relatedTransactionId).toBe(original.id);
    expect(adjustment.reference).toBe("CR-101");
  });

  it("named demo vendors (§18.3)", () => {
    const byName = (n: string) => {
      const v = townSquare.vendors.find((x) => x.companyName === n)!;
      return townSquare.subscriptions.find((s) => s.vendorId === v.id)!;
    };
    expect(byName("ABC Plumbing").status).toBe("active");
    expect(byName("XYZ Roofing").planId).toBe("premium");
    expect(byName("Home Electric").planId).toBe("professional");
    expect(byName("Green Inspection").status).toBe("none");
    expect(byName("Metro Cleaning").status).toBe("canceled");
  });
});

describe("ledger integrity for every Broker", () => {
  for (const d of BROKER_DATASETS) {
    it(`${d.broker.companyName}: batches reconcile with ledger rows`, () => {
      for (const batch of d.payoutBatches) {
        const rows = d.transactions.filter((t) =>
          batch.transactionIds.includes(t.id),
        );
        expect(sum(rows.map((r) => r.commissionCents))).toBe(
          batch.netPayoutCents,
        );
        expect(batch.grossCommissionCents + batch.adjustmentsCents).toBe(
          batch.netPayoutCents,
        );
        expect(batch.newCommissionCents + batch.renewalCommissionCents).toBe(
          batch.grossCommissionCents,
        );
      }
    });

    it(`${d.broker.companyName}: every row = eligible amount × rate`, () => {
      for (const t of d.transactions) {
        expect(t.commissionCents).toBe(
          commissionFor(t.eligibleAmountCents, t.rateBps),
        );
      }
    });

    it(`${d.broker.companyName}: one commission row per paid invoice (idempotent)`, () => {
      const positive = d.transactions.filter((t) => t.type !== "adjustment");
      expect(new Set(positive.map((t) => t.invoiceId)).size).toBe(
        positive.length,
      );
      const paid = d.invoices.filter((i) => i.paymentStatus !== "failed");
      expect(positive.length).toBe(paid.length);
      expect(
        d.invoices
          .filter((i) => i.paymentStatus === "failed")
          .every((i) => !d.transactions.some((t) => t.invoiceId === i.id)),
      ).toBe(true);
    });
  }
});

describe("Admin broker list (§15.2)", () => {
  const expected: Record<string, [number, number, number]> = {
    "town-square": [83, 61, 3_640],
    "century-realty": [44, 32, 2_890],
    northstar: [19, 11, 1_240],
    "metro-homes": [15, 8, 940],
  };
  for (const d of BROKER_DATASETS) {
    it(d.broker.companyName, () => {
      const [referred, paid, current] = expected[d.broker.id];
      const k = brokerKpis(d);
      expect(k.referredVendors).toBe(referred);
      expect(k.activePaidVendors).toBe(paid);
      expect(monthSummary(d, "2026-09").netCommissionCents).toBe(
        dollars(current),
      );
    });
  }
});
