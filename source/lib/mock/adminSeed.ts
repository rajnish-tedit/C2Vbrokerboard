import type { AuditEvent } from "@/lib/domain/types";

export type AttributionCase = {
  id: string;
  vendorName: string;
  attemptedCode: string;
  attemptedBrokerId: string | null;
  existingBrokerId: string | null;
  scenario:
    | "new_vendor"
    | "existing_unattributed"
    | "already_attributed"
    | "invalid_code"
    | "admin_override";
  outcome: string;
  status:
    "attributed" | "kept_original" | "rejected" | "needs_review" | "overridden";
  occurredAt: string;
};

export const ATTRIBUTION_CASES: AttributionCase[] = [
  {
    id: "ac_1",
    vendorName: "Harbor Electric LLC",
    attemptedCode: "TOWN35",
    attemptedBrokerId: "town-square",
    existingBrokerId: "century-realty",
    scenario: "already_attributed",
    outcome:
      "Already attributed to Century Realty Group on Mar 03, 2026. First valid attribution wins; no change made.",
    status: "kept_original",
    occurredAt: "2026-10-12T13:22:00Z",
  },
  {
    id: "ac_2",
    vendorName: "Sunrise Fencing",
    attemptedCode: "TOWNSQ",
    attemptedBrokerId: null,
    existingBrokerId: null,
    scenario: "invalid_code",
    outcome:
      "Promo code not recognised. Vendor saw a validation message; no attribution created.",
    status: "rejected",
    occurredAt: "2026-10-09T17:05:00Z",
  },
  {
    id: "ac_3",
    vendorName: "Allied Roofing Co.",
    attemptedCode: "NORTH35",
    attemptedBrokerId: "northstar",
    existingBrokerId: null,
    scenario: "existing_unattributed",
    outcome:
      "Vendor has been on C2V since Nov 2025 with no Broker. Policy pending: can an existing Vendor be claimed later?",
    status: "needs_review",
    occurredAt: "2026-10-21T10:48:00Z",
  },
  {
    id: "ac_4",
    vendorName: "Keystone Remodeling",
    attemptedCode: "CENTURY35",
    attemptedBrokerId: "century-realty",
    existingBrokerId: "northstar",
    scenario: "admin_override",
    outcome:
      "Moved from Northstar Brokerage to Century Realty Group by Admin. Future commission follows the new Broker from Sep 01, 2026.",
    status: "overridden",
    occurredAt: "2026-09-02T15:30:00Z",
  },
  {
    id: "ac_5",
    vendorName: "Smith HVAC",
    attemptedCode: "TOWN35",
    attemptedBrokerId: "town-square",
    existingBrokerId: null,
    scenario: "new_vendor",
    outcome:
      "New Vendor registered with promo code. Attribution created for Town Square Realty.",
    status: "attributed",
    occurredAt: "2026-09-13T09:14:00Z",
  },
];

export const SEED_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "ae_001",
    actor: "Sarah Kim (C2V Admin)",
    action: "broker.created",
    entityType: "Broker",
    entityId: "town-square",
    brokerId: "town-square",
    summary: "Created Broker account for Town Square Realty",
    before: null,
    after: "Status: Active",
    reason: "Signed affiliate agreement received",
    createdAt: "2025-07-28T15:02:00Z",
  },
  {
    id: "ae_002",
    actor: "Sarah Kim (C2V Admin)",
    action: "referral_code.assigned",
    entityType: "Broker",
    entityId: "town-square",
    brokerId: "town-square",
    summary: "Assigned referral code TOWN35",
    before: null,
    after: "TOWN35",
    reason: null,
    createdAt: "2025-07-28T15:04:00Z",
  },
  {
    id: "ae_003",
    actor: "System",
    action: "broker_user.invited",
    entityType: "BrokerUser",
    entityId: "bu_michael",
    brokerId: "town-square",
    summary: "Sent portal invitation to michael.carter@townsquarerealty.com",
    before: null,
    after: "Invited",
    reason: null,
    createdAt: "2025-07-28T15:05:00Z",
  },
  {
    id: "ae_004",
    actor: "System (Stripe sync)",
    action: "payout_account.connected",
    entityType: "BrokerPayoutAccount",
    entityId: "acct_demo_1TownSq35",
    brokerId: "town-square",
    summary: "Stripe connected account verified; payouts enabled",
    before: "Under Review",
    after: "Connected",
    reason: null,
    createdAt: "2025-08-04T11:40:00Z",
  },
  {
    id: "ae_005",
    actor: "Sarah Kim (C2V Admin)",
    action: "policy.updated",
    entityType: "CommissionPolicy",
    entityId: "default",
    brokerId: null,
    summary:
      "Set default program policy (sample values pending customer approval)",
    before: null,
    after: "35% · 12 months · 7-day hold · settle on the 5th",
    reason: "Prototype defaults from specification §23",
    createdAt: "2026-01-05T09:00:00Z",
  },
  {
    id: "ae_006",
    actor: "Daniel Ortiz (C2V Finance)",
    action: "attribution.override",
    entityType: "BrokerVendorReferral",
    entityId: "Keystone Remodeling",
    brokerId: "century-realty",
    summary:
      "Moved Keystone Remodeling from Northstar Brokerage to Century Realty Group",
    before: "Northstar Brokerage (NORTH35)",
    after: "Century Realty Group (CENTURY35)",
    reason:
      "Vendor supplied a signed Century referral agreement pre-dating the Northstar link click",
    createdAt: "2026-09-02T15:30:00Z",
  },
  {
    id: "ae_007",
    actor: "System (Recurly webhook)",
    action: "commission.adjustment_created",
    entityType: "CommissionTransaction",
    entityId: "CR-101",
    brokerId: "town-square",
    summary: "Partial refund on ABC Plumbing INV created −$14.00 adjustment",
    before: null,
    after: "−$14.00",
    reason: "Recurly credit applied",
    createdAt: "2026-09-18T16:39:00Z",
  },
  {
    id: "ae_008",
    actor: "System (Recurly webhook)",
    action: "webhook.duplicate_ignored",
    entityType: "RecurlyEvent",
    entityId: "evt_demo_payment_succeeded_77310",
    brokerId: "town-square",
    summary:
      "Duplicate payment_succeeded webhook ignored — commission already recorded",
    before: null,
    after: null,
    reason: "Idempotency key matched existing ledger entry",
    createdAt: "2026-10-02T08:14:00Z",
  },
  {
    id: "ae_009",
    actor: "System (Settlement job)",
    action: "payout_batches.generated",
    entityType: "PayoutBatch",
    entityId: "2026-09",
    brokerId: null,
    summary: "Generated September 2026 payout batches for 4 Brokers",
    before: null,
    after: "3 finalized · 1 on hold",
    reason: null,
    createdAt: "2026-10-01T02:00:00Z",
  },
  {
    id: "ae_010",
    actor: "System (Settlement job)",
    action: "payout_batch.on_hold",
    entityType: "PayoutBatch",
    entityId: "po_metro-homes_2026_09",
    brokerId: "metro-homes",
    summary: "Metro Homes batch placed on hold: payout account not connected",
    before: "Calculated",
    after: "On Hold",
    reason: "No Stripe connected account",
    createdAt: "2026-10-01T02:00:05Z",
  },
  {
    id: "ae_011",
    actor: "System (Stripe webhook)",
    action: "bank_payout.failed",
    entityType: "PayoutBatch",
    entityId: "po_northstar_2026_09",
    brokerId: "northstar",
    summary: "Northstar Brokerage bank payout failed (account closed, R02)",
    before: "In Transit",
    after: "Failed",
    reason: "Stripe payout.failed",
    createdAt: "2026-10-07T13:11:00Z",
  },
  {
    id: "ae_012",
    actor: "Sarah Kim (C2V Admin)",
    action: "stripe.update_link_sent",
    entityType: "BrokerPayoutAccount",
    entityId: "acct_demo_1Northstr",
    brokerId: "northstar",
    summary: "Sent Stripe account-update link to Marcus Bell",
    before: null,
    after: null,
    reason: "Follow-up on failed bank payout",
    createdAt: "2026-10-08T10:02:00Z",
  },
];
