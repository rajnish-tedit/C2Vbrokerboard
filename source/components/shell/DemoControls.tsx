"use client";

import { FlaskConical, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { STRIPE_STATUS } from "@/lib/domain/status";
import type { StripeSetupStatus } from "@/lib/domain/types";
import { DEMO_CREDENTIALS } from "@/lib/mock";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

const STRIPE_OPTIONS: StripeSetupStatus[] = [
  "not_connected",
  "incomplete",
  "under_review",
  "connected",
  "action_required",
];

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
      <span>
        <span className="block text-sm font-medium text-navy-950">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-navy-900"
      />
    </label>
  );
}

export function DemoControls({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const demo = useDemo();
  const router = useRouter();
  const toast = useToast();
  const role = demo.state.session?.role ?? "broker";

  const switchRole = (next: "broker" | "admin") => {
    demo.signIn(
      next,
      next === "admin" ? DEMO_CREDENTIALS.adminEmail : DEMO_CREDENTIALS.email,
    );
    onClose();
    router.push(next === "admin" ? "/admin/brokers" : "/broker/dashboard");
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Demo controls"
      subtitle="Prototype only — these switches do not exist in production."
      footer={
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            demo.resetDemo();
            toast("Demo data reset to the default story");
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset demo data
        </Button>
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            View as
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["broker", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium",
                  role === r
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-slate-200 text-navy-900 hover:bg-slate-50",
                )}
              >
                {r === "broker"
                  ? "Broker (Michael Carter)"
                  : "C2V Admin (Sarah Kim)"}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Town Square Stripe payout setup
          </h3>
          <div
            className="mt-2 space-y-1.5"
            role="radiogroup"
            aria-label="Stripe setup state"
          >
            {STRIPE_OPTIONS.map((status) => (
              <label
                key={status}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                  demo.state.stripeStatus === status &&
                    !demo.state.previewNewBroker
                    ? "border-navy-900 bg-navy-50"
                    : "border-slate-200 hover:bg-slate-50",
                )}
              >
                <input
                  type="radio"
                  name="stripe-status"
                  checked={demo.state.stripeStatus === status}
                  onChange={() => demo.setStripeStatus(status)}
                  className="accent-navy-900"
                />
                <span className="font-medium text-navy-950">
                  {STRIPE_STATUS[status].label}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Scenarios
          </h3>
          <Toggle
            checked={demo.state.bankPayoutFailed}
            onChange={demo.setBankPayoutFailed}
            label="Fail the September bank payout"
            description="Transfer stays successful; the bank rejects the payout and Stripe needs action."
          />
          <Toggle
            checked={demo.state.previewNewBroker}
            onChange={demo.setPreviewNewBroker}
            label="First-time login dashboard (no data yet)"
            description="No referred Vendors, no commission history and no payout account (empty states)."
          />
        </section>

        <p className="flex items-start gap-2 rounded-lg bg-gold-50 p-3 text-xs text-gold-700">
          <FlaskConical
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          All data is simulated. Demo date is fixed at Oct 28, 2026. Nothing
          connects to Recurly, Stripe or a bank.
        </p>
      </div>
    </Drawer>
  );
}
