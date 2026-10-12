export type ISODate = string;
export type MonthKey = string;
export type Cents = number;

export type PlanId = "starter" | "professional" | "premium";
export type BillingFrequency = "monthly" | "annual";

export type SubscriptionStatus =
  "trial" | "active" | "past_due" | "canceled" | "expired" | "free" | "none";

export type VendorPaymentStatus =
  "paid" | "failed" | "refunded" | "partially_refunded";

export type CommissionStatus =
  | "pending"
  | "eligible"
  | "included_in_payout"
  | "transferred"
  | "paid"
  | "not_eligible";

export type CommissionAdjustmentFlag = "adjusted" | "reversed";

export type CommissionType = "new" | "renewal" | "adjustment";

export type BatchStatus = "draft" | "calculated" | "finalized" | "on_hold";
export type TransferStatus =
  "not_started" | "processing" | "transferred" | "failed";
export type BankPayoutStatus =
  "pending" | "in_transit" | "paid" | "failed" | "canceled";

export type StripeSetupStatus =
  | "not_connected"
  | "incomplete"
  | "under_review"
  | "connected"
  | "action_required";

export type AgentStatus = "active" | "inactive" | "invited";
export type AttributionSource =
  "referral_link" | "promo_code" | "admin_override";
export type LoginStatus = "active" | "invited" | "not_invited" | "suspended";

export type Plan = {
  id: PlanId;
  name: string;
  monthlyPriceCents: Cents;
  annualPriceCents: Cents;
};

export type Broker = {
  id: string;
  companyName: string;
  city: string;
  status: "active" | "paused";
  referralCode: string;
  referralUrl: string;
  defaultCommissionRateBps: number;
  loginStatus: LoginStatus;
  joinedAt: ISODate;
  primaryUserId: string;
  payoutsPaused: boolean;
};

export type BrokerUser = {
  id: string;
  brokerId: string;
  name: string;
  email: string;
  phone: string;
  role: "owner" | "finance" | "viewer";
  status: "active" | "invited" | "not_activated";
  lastLoginAt: ISODate | null;
};

export type Agent = {
  id: string;
  brokerId: string;
  name: string;
  email: string;
  office: string;
  status: AgentStatus;
  joinedAt: ISODate;
  relationshipStatus: "linked" | "pending";
  linkedAt: ISODate;
};

export type Vendor = {
  id: string;
  companyName: string;
  trade: string;
  contactName: string;
  city: string;
  state: string;
  registeredAt: ISODate;
  taxRateBps: number;
};

export type BrokerVendorReferral = {
  id: string;
  brokerId: string;
  vendorId: string;
  promoCode: string;
  attributionSource: AttributionSource;
  referredAt: ISODate;
  commissionRateBps: number;
  commissionStartAt: ISODate | null;
  commissionEndAt: ISODate | null;
  status: "attributed" | "overridden";
};

export type VendorSubscriptionSnapshot = {
  vendorId: string;
  recurlyAccountId: string;
  subscriptionId: string | null;
  planId: PlanId | null;
  billingFrequency: BillingFrequency | null;
  status: SubscriptionStatus;
  firstPaidAt: ISODate | null;
  canceledAt: ISODate | null;
  currentPeriodEndsAt: ISODate | null;
  trialEndsAt: ISODate | null;
};

export type InvoiceKind = "new" | "renewal" | "upgrade_proration";

export type Invoice = {
  id: string;
  number: string;
  brokerId: string;
  vendorId: string;
  recurlyInvoiceId: string;
  date: ISODate;
  planId: PlanId;
  billingFrequency: BillingFrequency;
  kind: InvoiceKind;
  description: string;
  listPriceCents: Cents;
  discountCents: Cents;
  amountCents: Cents;
  taxCents: Cents;
  chargedCents: Cents;
  paymentStatus: VendorPaymentStatus;
  paymentReference: string | null;
  refundedCents: Cents;
};

export type Credit = {
  id: string;
  number: string;
  brokerId: string;
  vendorId: string;
  invoiceId: string;
  date: ISODate;
  amountCents: Cents;
  reason: string;
  kind: "refund" | "partial_refund";
};

export type CommissionTransaction = {
  id: string;
  brokerId: string;
  vendorId: string;
  subscriptionId: string;
  invoiceId: string;
  creditId: string | null;
  relatedTransactionId: string | null;
  reference: string;
  paymentReference: string | null;
  type: CommissionType;
  planId: PlanId;
  eligibleAmountCents: Cents;
  rateBps: number;
  commissionCents: Cents;
  status: CommissionStatus;
  adjustmentFlag: CommissionAdjustmentFlag | null;
  ineligibleReason: string | null;
  earnedAt: ISODate;
  eligibleAt: ISODate;
  periodMonth: MonthKey;
  payoutBatchId: string | null;
  carriedForward: boolean;
};

export type PayoutBatch = {
  id: string;
  brokerId: string;
  periodMonth: MonthKey;
  periodStart: ISODate;
  periodEnd: ISODate;
  settlementCutoffAt: ISODate;
  subscriptionRevenueCents: Cents;
  eligibleRevenueCents: Cents;
  newCommissionCents: Cents;
  renewalCommissionCents: Cents;
  grossCommissionCents: Cents;
  adjustmentsCents: Cents;
  netPayoutCents: Cents;
  batchStatus: BatchStatus;
  transferStatus: TransferStatus;
  stripeTransferReference: string | null;
  transferredAt: ISODate | null;
  bankPayoutStatus: BankPayoutStatus;
  bankPayoutReference: string | null;
  bankPaidAt: ISODate | null;
  bankPayoutExpectedAt: ISODate | null;
  failureReason: string | null;
  holdReason: string | null;
  transactionIds: string[];
};

export type BrokerPayoutAccount = {
  brokerId: string;
  stripeConnectedAccountId: string | null;
  onboardingStatus: StripeSetupStatus;
  payoutsEnabled: boolean;
  requirementsStatus: string;
  maskedBankDisplay: string | null;
  bankName: string | null;
  connectedAt: ISODate | null;
  lastStatusSyncAt: ISODate;
  payoutSchedule: string;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  brokerId: string | null;
  summary: string;
  before: string | null;
  after: string | null;
  reason: string | null;
  createdAt: string;
};

export type NotificationKind =
  | "stripe_setup"
  | "statement_ready"
  | "payout_transferred"
  | "bank_paid"
  | "payout_failed"
  | "commission_adjustment"
  | "new_vendor";

export type BrokerNotification = {
  id: string;
  brokerId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  createdAt: string;
};

export type ReferralActivity = {
  month: MonthKey;
  linkClicks: number;
  registrations: number;
  paidConversions: number;
};

export type BrokerDataset = {
  broker: Broker;
  users: BrokerUser[];
  agents: Agent[];
  vendors: Vendor[];
  referrals: BrokerVendorReferral[];
  subscriptions: VendorSubscriptionSnapshot[];
  invoices: Invoice[];
  credits: Credit[];
  transactions: CommissionTransaction[];
  payoutBatches: PayoutBatch[];
  payoutAccount: BrokerPayoutAccount;
  notifications: BrokerNotification[];
  referralActivity: ReferralActivity[];
};
