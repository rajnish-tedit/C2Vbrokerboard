"use client";

import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import type { BrokerDataset } from "@/lib/domain/types";

export function PayoutSetupAlert({ data }: { data: BrokerDataset }) {
  const failed = data.payoutBatches.find(
    (b) => b.bankPayoutStatus === "failed",
  );
  const status = data.payoutAccount.onboardingStatus;

  if (failed) {
    return (
      <Callout
        tone="danger"
        title="Action required: your September bank payout failed"
        action={
          <Button href="/broker/payout-settings" variant="danger" size="sm">
            Update payout account
          </Button>
        }
      >
        Your commission was calculated and transferred correctly. Your bank
        rejected the payout, so update your payout account in Stripe to receive
        it.
      </Callout>
    );
  }
  if (status === "connected") return null;
  const copy = {
    not_connected: {
      tone: "warning" as const,
      title: "Set up your payout account to receive commission",
      body: "You're earning commission, but C2V can't send payouts until you connect a Stripe payout account.",
      cta: "Set up payout account",
    },
    incomplete: {
      tone: "warning" as const,
      title: "Finish your payout account setup",
      body: "Stripe still needs a few details before payouts can start.",
      cta: "Resume setup",
    },
    under_review: {
      tone: "info" as const,
      title: "Stripe is verifying your payout account",
      body: "Verification usually takes 1–2 business days. Commission keeps accruing in the meantime.",
      cta: "View status",
    },
    action_required: {
      tone: "danger" as const,
      title: "Stripe needs updated information",
      body: "Payouts are paused until you update your payout account requirements.",
      cta: "Update requirements",
    },
  }[status];
  return (
    <Callout
      tone={copy.tone}
      title={copy.title}
      action={
        <Button
          href="/broker/payout-settings"
          variant={copy.tone === "danger" ? "danger" : "primary"}
          size="sm"
        >
          {copy.cta}
        </Button>
      }
    >
      {copy.body}
    </Callout>
  );
}
