"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AUTH_INPUT, AuthButton, AuthLabel, AuthLayout } from "@/components/auth/AuthLayout";
import { useToast } from "@/components/ui/Toast";
import { knownAccount } from "@/lib/domain/credentials";
import { EMAIL_RE } from "@/lib/domain/locations";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

export function ForgotPasswordView() {
  const params = useSearchParams();
  const router = useRouter();
  const demo = useDemo();
  const toast = useToast();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const em = email.trim().toLowerCase();
  const exists = knownAccount(demo.state, em) !== null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(em)) {
      setError("Enter the email address linked to your account.");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    setSent(true);
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <Link href="/broker/login" aria-label="Back to sign in" className="mb-8 inline-flex rounded-lg p-1.5 text-brand-700 hover:bg-brand-50">
          <ArrowLeft className="h-6 w-6" />
        </Link>

        {!sent ? (
          <form onSubmit={submit} noValidate className="space-y-5">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-navy-950">Forgot your password?</h1>
              <p className="mt-2 text-[15px] text-slate-500">Enter the email linked to your broker account and we will send you a link to reset your password.</p>
            </div>
            <div>
              <AuthLabel htmlFor="fp-email">Business email</AuthLabel>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(undefined); }}
                placeholder="e.g. name@yourbrokerage.com"
                className={cn(AUTH_INPUT, error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100")}
              />
              {error && <p role="alert" className="mt-1.5 text-xs text-rose-600">{error}</p>}
            </div>
            <AuthButton type="submit" disabled={busy} className="w-full">{busy ? "Sending…" : "Send reset link"}</AuthButton>
            <p className="text-center text-sm text-slate-600">
              Remembered it? <Link href="/broker/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link>
            </p>
          </form>
        ) : (
          <div className="space-y-6" role="status">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <MailCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-navy-950">Check your email</h1>
              <p className="mt-2 text-[15px] text-slate-600">
                If an account exists for <span className="font-semibold text-navy-950">{em}</span>, a password reset link is on its way. The link expires in 30 minutes.
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-sun/70 bg-sun-50/60 p-4 text-sm">
              <p className="font-semibold text-navy-950">Prototype only</p>
              <p className="mt-1 text-slate-600">
                No email is sent. {exists ? "Use the button to open the reset link as if you clicked it in your inbox." : "This email is not registered in the prototype, so no reset link was created. A real product shows the same message."}
              </p>
              {exists && (
                <button
                  type="button"
                  onClick={() => router.push(`/broker/reset-password?email=${encodeURIComponent(em)}&token=demo`)}
                  className="mt-3 font-semibold text-brand-700 underline-offset-2 hover:underline"
                >
                  Open reset link (demo)
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <Link href="/broker/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link>
              <button type="button" onClick={() => toast(`Reset link sent again to ${em}`)} className="font-medium text-slate-600 hover:text-brand-700 hover:underline">
                Resend link
              </button>
              <button type="button" onClick={() => setSent(false)} className="font-medium text-slate-600 hover:text-brand-700 hover:underline">
                Use a different email
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
