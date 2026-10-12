"use client";

import { Copy, Link2, Ticket } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { Broker } from "@/lib/domain/types";

async function copy(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function ReferralLinkCard({
  broker,
  compact,
}: {
  broker: Broker;
  compact?: boolean;
}) {
  const toast = useToast();
  const onCopy = async (value: string, what: string) => {
    const ok = await copy(value);
    toast(ok ? `${what} copied to clipboard` : `${what}: ${value}`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-950 text-white shadow-card">
      <div className="grid gap-px bg-white/10 md:grid-cols-[minmax(0,220px)_1fr]">
        <div className="bg-navy-950 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-navy-300">
            <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
            Promo code
          </p>
          <p className="num mt-2 font-mono text-3xl font-semibold tracking-wider text-gold">
            {broker.referralCode}
          </p>
          <Button
            variant="gold"
            size="sm"
            className="mt-4"
            onClick={() => onCopy(broker.referralCode, "Promo code")}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy Code
          </Button>
        </div>
        <div className="bg-navy-950 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-navy-300">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Referral link
          </p>
          <p className="mt-2 break-all rounded-lg bg-white/5 px-3 py-2.5 font-mono text-sm text-navy-100 ring-1 ring-inset ring-white/10">
            {broker.referralUrl}
          </p>
          <Button
            variant="gold"
            size="sm"
            className="mt-4"
            onClick={() => onCopy(broker.referralUrl, "Referral link")}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy Link
          </Button>
        </div>
      </div>
      {!compact && (
        <p className="border-t border-white/10 px-5 py-3 text-xs text-navy-300">
          Vendors who register using this link or code are attributed to{" "}
          {broker.companyName}, subject to referral ownership rules.
        </p>
      )}
    </div>
  );
}
