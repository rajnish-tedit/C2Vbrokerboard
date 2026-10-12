"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type DefaultValues, type Resolver } from "react-hook-form";
import type { z } from "zod";

import { FormInput } from "@/components/forms/FormInput";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { StripeSetupStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import {
  onboardingBankSchema,
  onboardingBusinessSchema,
  onboardingIdentitySchema,
  type OnboardingBank,
  type OnboardingBusiness,
  type OnboardingIdentity,
} from "@/lib/validation";

export type OnboardingStep =
  "business" | "identity" | "bank" | "review" | "success";

const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: "business", label: "Business" },
  { key: "identity", label: "Identity" },
  { key: "bank", label: "Bank account" },
  { key: "review", label: "Review" },
];

type Outcome = "connected" | "under_review" | "incomplete";

type Props = {
  open: boolean;
  startAt?: OnboardingStep;
  companyName: string;
  onClose: (status?: StripeSetupStatus) => void;
};

function StepForm<T extends Record<string, string | undefined>>({
  schema,
  defaults,
  fields,
  onNext,
  onBack,
  onSaveExit,
}: {
  schema: z.ZodType<T>;
  defaults: T;
  fields: {
    name: keyof T & string;
    label: string;
    placeholder?: string;
    type?: string;
    hint?: string;
  }[];
  onNext: (values: T) => void;
  onBack?: () => void;
  onSaveExit: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<T>({
    resolver: zodResolver(schema) as unknown as Resolver<T>,
    defaultValues: defaults as DefaultValues<T>,
  });
  return (
    <form
      onSubmit={handleSubmit((v) => onNext(v))}
      noValidate
      className="space-y-4"
    >
      {fields.map((f) => (
        <div key={f.name}>
          <FormInput
            label={f.label}
            type={f.type ?? "text"}
            placeholder={f.placeholder}
            error={
              (errors as Record<string, { message?: string }>)[f.name]?.message
            }
            {...register(f.name as never)}
          />
          {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={onSaveExit}
          className="text-sm font-medium text-slate-500 hover:text-navy-900"
        >
          Save and finish later
        </button>
        <div className="flex gap-2">
          {onBack && (
            <Button variant="secondary" onClick={onBack}>
              Back
            </Button>
          )}
          <Button type="submit" className="bg-[#635bff] hover:bg-[#5249e8]">
            Continue
          </Button>
        </div>
      </div>
    </form>
  );
}

export function SimulatedStripeOnboarding({
  open,
  startAt = "business",
  companyName,
  onClose,
}: Props) {
  const [step, setStep] = useState<OnboardingStep>(startAt);
  const [business, setBusiness] = useState<OnboardingBusiness>({
    legalName: `${companyName} LLC`,
    ein: "74-3519208",
    address: "401 Congress Ave, Suite 1500, Austin, TX 78701",
    website: "townsquarerealty.com",
  });
  const [identity, setIdentity] = useState<OnboardingIdentity>({
    representative: "Michael Carter",
    title: "Managing Broker",
    dob: "1979-04-12",
    ssnLast4: "4417",
  });
  const [bank, setBank] = useState<OnboardingBank>({
    accountHolder: `${companyName} LLC`,
    routing: "111000614",
    account: "000987654821",
  });
  const [outcome, setOutcome] = useState<Outcome>("connected");

  useEffect(() => {
    if (open) setStep(startAt);
  }, [open, startAt]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const saveExit = () => onClose("incomplete");

  return (
    <Modal
      open={open}
      onClose={() => onClose()}
      title="Set up payouts with Stripe"
      size="lg"
    >
      <div className="-mx-6 -mt-5 mb-5 flex items-center justify-between gap-3 border-b border-slate-200 bg-[#f6f9fc] px-6 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#635bff]">
          <span className="rounded bg-[#635bff] px-1.5 py-0.5 text-xs font-bold text-white">
            stripe
          </span>
          Connect onboarding
        </p>
        <span className="rounded-full bg-gold-50 px-2.5 py-1 text-xs font-medium text-gold-700 ring-1 ring-inset ring-gold-200">
          Simulated · no data leaves this page
        </span>
      </div>

      {step !== "success" && (
        <ol
          className="mb-6 grid grid-cols-4 gap-2"
          aria-label="Onboarding steps"
        >
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  i <= stepIndex ? "bg-[#635bff]" : "bg-slate-200",
                )}
              />
              <p
                className={cn(
                  "mt-1.5 text-xs font-medium",
                  i === stepIndex ? "text-navy-950" : "text-slate-500",
                )}
              >
                {i + 1}. {s.label}
              </p>
            </li>
          ))}
        </ol>
      )}

      {step === "business" && (
        <StepForm
          schema={onboardingBusinessSchema}
          defaults={business}
          onSaveExit={saveExit}
          onNext={(v) => {
            setBusiness(v);
            setStep("identity");
          }}
          fields={[
            { name: "legalName", label: "Legal business name" },
            {
              name: "ein",
              label: "Employer Identification Number (EIN)",
              placeholder: "12-3456789",
            },
            { name: "address", label: "Registered business address" },
            { name: "website", label: "Business website (optional)" },
          ]}
        />
      )}
      {step === "identity" && (
        <StepForm
          schema={onboardingIdentitySchema}
          defaults={identity}
          onSaveExit={saveExit}
          onBack={() => setStep("business")}
          onNext={(v) => {
            setIdentity(v);
            setStep("bank");
          }}
          fields={[
            { name: "representative", label: "Company representative" },
            { name: "title", label: "Title" },
            { name: "dob", label: "Date of birth", type: "date" },
            {
              name: "ssnLast4",
              label: "Last 4 digits of SSN",
              hint: "Stripe uses this to verify identity. C2V never sees it.",
            },
          ]}
        />
      )}
      {step === "bank" && (
        <StepForm
          schema={onboardingBankSchema}
          defaults={bank}
          onSaveExit={saveExit}
          onBack={() => setStep("identity")}
          onNext={(v) => {
            setBank(v);
            setStep("review");
          }}
          fields={[
            { name: "accountHolder", label: "Account holder name" },
            { name: "routing", label: "Routing number" },
            {
              name: "account",
              label: "Account number",
              hint: "Stored by Stripe only. C2V receives the last 4 digits for display.",
            },
          ]}
        />
      )}
      {step === "review" && (
        <div className="space-y-5">
          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
            {[
              ["Business", `${business.legalName} · EIN ${business.ein}`],
              ["Address", business.address],
              [
                "Representative",
                `${identity.representative}, ${identity.title}`,
              ],
              [
                "Payout bank",
                `${bank.accountHolder} · routing ${bank.routing} · •••• ${bank.account.slice(-4)}`,
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right text-navy-950">{v}</dd>
              </div>
            ))}
          </dl>
          <fieldset className="rounded-xl border border-dashed border-gold-200 bg-gold-50/50 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gold-700">
              Demo: verification result
            </legend>
            <div className="space-y-2 text-sm">
              {(
                [
                  ["connected", "Verified instantly — payouts enabled"],
                  [
                    "under_review",
                    "Stripe needs to review documents (Under Review)",
                  ],
                  [
                    "incomplete",
                    "More information required (Onboarding Incomplete)",
                  ],
                ] as [Outcome, string][]
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="outcome"
                    checked={outcome === value}
                    onChange={() => setOutcome(value)}
                    className="accent-navy-900"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-between gap-2">
            <Button variant="secondary" onClick={() => setStep("bank")}>
              Back
            </Button>
            <Button
              className="bg-[#635bff] hover:bg-[#5249e8]"
              onClick={() => setStep("success")}
            >
              Submit to Stripe
            </Button>
          </div>
        </div>
      )}
      {step === "success" && (
        <div className="py-6 text-center">
          <CircleCheck
            className="mx-auto h-12 w-12 text-emerald-500"
            aria-hidden="true"
          />
          <h3 className="mt-3 text-lg font-semibold text-navy-950">
            {outcome === "connected"
              ? "You're all set"
              : outcome === "under_review"
                ? "Submitted for verification"
                : "Almost there"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
            {outcome === "connected"
              ? `Payouts to •••• ${bank.account.slice(-4)} are enabled. C2V will send your commission automatically each month.`
              : outcome === "under_review"
                ? "Stripe is verifying your details. This usually takes 1–2 business days."
                : "Stripe needs a few more details before payouts can start."}
          </p>
          <Button className="mt-6" onClick={() => onClose(outcome)}>
            Return to C2V
          </Button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Bank and identity details stay with Stripe. C2V stores only account
            status and masked display values.
          </p>
        </div>
      )}
    </Modal>
  );
}
