import type {
  AgentStatus,
  BankPayoutStatus,
  BatchStatus,
  CommissionAdjustmentFlag,
  CommissionStatus,
  CommissionType,
  StripeSetupStatus,
  SubscriptionStatus,
  TransferStatus,
  VendorPaymentStatus,
} from "./types";

export type StatusTone =
  "success" | "info" | "warning" | "danger" | "neutral" | "pending" | "brand";

export type StatusIcon =
  | "check"
  | "clock"
  | "alert"
  | "x"
  | "arrow"
  | "pause"
  | "minus"
  | "spark"
  | "dot"
  | "undo";

export type StatusMeta = {
  label: string;
  tone: StatusTone;
  icon: StatusIcon;
  help: string;
};

export const SUBSCRIPTION_STATUS: Record<SubscriptionStatus, StatusMeta> = {
  trial: {
    label: "Trial",
    tone: "info",
    icon: "clock",
    help: "Free trial. No commission until the first paid invoice succeeds.",
  },
  active: {
    label: "Active",
    tone: "success",
    icon: "check",
    help: "Paid Vendor subscription in good standing.",
  },
  past_due: {
    label: "Past Due",
    tone: "warning",
    icon: "alert",
    help: "Latest payment failed. No commission until Recurly collects it.",
  },
  canceled: {
    label: "Canceled",
    tone: "neutral",
    icon: "x",
    help: "Subscription canceled. Future renewals stop; earned commission stays.",
  },
  expired: {
    label: "Expired",
    tone: "neutral",
    icon: "minus",
    help: "Subscription term ended without renewal.",
  },
  free: {
    label: "Free",
    tone: "neutral",
    icon: "dot",
    help: "Free plan ($0 invoices earn no commission).",
  },
  none: {
    label: "None",
    tone: "neutral",
    icon: "dot",
    help: "Registered but no subscription selected yet.",
  },
};

export const PAYMENT_STATUS: Record<VendorPaymentStatus, StatusMeta> = {
  paid: {
    label: "Paid",
    tone: "success",
    icon: "check",
    help: "Vendor payment collected by Recurly via Stripe.",
  },
  failed: {
    label: "Failed",
    tone: "danger",
    icon: "x",
    help: "Vendor payment failed. No commission is created.",
  },
  refunded: {
    label: "Refunded",
    tone: "danger",
    icon: "undo",
    help: "Payment fully refunded. A reversing commission adjustment was created.",
  },
  partially_refunded: {
    label: "Partially Refunded",
    tone: "warning",
    icon: "undo",
    help: "Part of the payment was refunded. A proportional negative adjustment was created.",
  },
};

export const COMMISSION_STATUS: Record<CommissionStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    tone: "pending",
    icon: "clock",
    help: "Payment collected; commission is inside the 7-day holding period.",
  },
  eligible: {
    label: "Eligible",
    tone: "info",
    icon: "spark",
    help: "Holding period complete. Will be included in the next monthly settlement.",
  },
  included_in_payout: {
    label: "Included in Payout",
    tone: "brand",
    icon: "arrow",
    help: "Added to a monthly payout batch that has not been transferred yet.",
  },
  transferred: {
    label: "Transferred",
    tone: "brand",
    icon: "arrow",
    help: "Sent from C2V to your Stripe payout account. Bank payout not yet completed.",
  },
  paid: {
    label: "Paid",
    tone: "success",
    icon: "check",
    help: "Paid out to your bank account.",
  },
  not_eligible: {
    label: "Not Eligible",
    tone: "neutral",
    icon: "minus",
    help: "Payment is outside the referral commission period, so no commission was earned.",
  },
};

export const ADJUSTMENT_FLAG: Record<CommissionAdjustmentFlag, StatusMeta> = {
  adjusted: {
    label: "Adjusted",
    tone: "warning",
    icon: "undo",
    help: "A partial refund created a separate negative entry. This original row is unchanged.",
  },
  reversed: {
    label: "Reversed",
    tone: "danger",
    icon: "undo",
    help: "A full refund created a separate entry reversing this commission. This original row is unchanged.",
  },
};

export const COMMISSION_TYPE: Record<CommissionType, string> = {
  new: "New",
  renewal: "Renewal",
  adjustment: "Refund Adj.",
};

export const BATCH_STATUS: Record<BatchStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    tone: "neutral",
    icon: "dot",
    help: "Batch is being assembled.",
  },
  calculated: {
    label: "Calculated",
    tone: "info",
    icon: "spark",
    help: "Totals calculated; awaiting settlement date.",
  },
  finalized: {
    label: "Finalized",
    tone: "success",
    icon: "check",
    help: "Totals locked for this commission period.",
  },
  on_hold: {
    label: "On Hold",
    tone: "warning",
    icon: "pause",
    help: "Payout paused. Commission remains owed.",
  },
};

export const TRANSFER_STATUS: Record<TransferStatus, StatusMeta> = {
  not_started: {
    label: "Not Started",
    tone: "neutral",
    icon: "dot",
    help: "No Stripe transfer created yet.",
  },
  processing: {
    label: "Processing",
    tone: "info",
    icon: "clock",
    help: "Stripe transfer in progress.",
  },
  transferred: {
    label: "Transferred",
    tone: "success",
    icon: "check",
    help: "Funds moved from the C2V platform balance to your Stripe payout account.",
  },
  failed: {
    label: "Failed",
    tone: "danger",
    icon: "x",
    help: "Stripe transfer failed. C2V will retry safely.",
  },
};

export const BANK_STATUS: Record<BankPayoutStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    tone: "neutral",
    icon: "clock",
    help: "Waiting for the transfer before Stripe can pay your bank.",
  },
  in_transit: {
    label: "In Transit",
    tone: "info",
    icon: "arrow",
    help: "Stripe has sent the payout; your bank has not confirmed it yet.",
  },
  paid: {
    label: "Paid",
    tone: "success",
    icon: "check",
    help: "Funds arrived in your bank account.",
  },
  failed: {
    label: "Failed",
    tone: "danger",
    icon: "alert",
    help: "Your bank rejected the payout. Your commission is still owed; update your payout account.",
  },
  canceled: {
    label: "Canceled",
    tone: "neutral",
    icon: "x",
    help: "Bank payout canceled.",
  },
};

export const STRIPE_STATUS: Record<StripeSetupStatus, StatusMeta> = {
  not_connected: {
    label: "Not Connected",
    tone: "neutral",
    icon: "dot",
    help: "No payout account yet. Commission is still earned and held until setup is complete.",
  },
  incomplete: {
    label: "Onboarding Incomplete",
    tone: "warning",
    icon: "clock",
    help: "Setup started but Stripe still needs information.",
  },
  under_review: {
    label: "Under Review",
    tone: "info",
    icon: "clock",
    help: "Stripe is verifying your details. Payouts may be unavailable.",
  },
  connected: {
    label: "Connected · Payouts Enabled",
    tone: "success",
    icon: "check",
    help: "Verified. Commission payouts are automatic.",
  },
  action_required: {
    label: "Action Required",
    tone: "danger",
    icon: "alert",
    help: "Stripe needs updated information before payouts can resume.",
  },
};

export const AGENT_STATUS: Record<AgentStatus, StatusMeta> = {
  active: {
    label: "Active",
    tone: "success",
    icon: "check",
    help: "Agent account active on C2V.",
  },
  inactive: {
    label: "Inactive",
    tone: "neutral",
    icon: "minus",
    help: "Agent account deactivated.",
  },
  invited: {
    label: "Invited",
    tone: "info",
    icon: "clock",
    help: "Invitation sent; Agent has not activated yet.",
  },
};

export type ReferralStatus =
  | "subscribed"
  | "trial"
  | "not_subscribed"
  | "past_due"
  | "canceled"
  | "expired";

export const REFERRAL_STATUS: Record<ReferralStatus, StatusMeta> = {
  subscribed: {
    label: "Subscribed",
    tone: "success",
    icon: "check",
    help: "On an eligible paid Vendor plan.",
  },
  trial: {
    label: "In Trial",
    tone: "info",
    icon: "clock",
    help: "Trial started; no paid conversion yet.",
  },
  not_subscribed: {
    label: "Not Subscribed",
    tone: "neutral",
    icon: "dot",
    help: "Registered, no paid plan.",
  },
  past_due: {
    label: "Payment Issue",
    tone: "warning",
    icon: "alert",
    help: "Subscribed but latest payment failed.",
  },
  canceled: {
    label: "Canceled",
    tone: "neutral",
    icon: "x",
    help: "Previously subscribed, now canceled.",
  },
  expired: {
    label: "Expired",
    tone: "neutral",
    icon: "minus",
    help: "Subscription term ended.",
  },
};

export function referralStatusFor(status: SubscriptionStatus): ReferralStatus {
  switch (status) {
    case "active":
      return "subscribed";
    case "trial":
      return "trial";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "expired":
      return "expired";
    default:
      return "not_subscribed";
  }
}
