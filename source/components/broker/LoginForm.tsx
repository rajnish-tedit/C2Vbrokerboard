"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AUTH_INPUT, AuthButton, AuthLabel } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Callout } from "@/components/ui/Callout";
import { expectedPassword, knownAccount } from "@/lib/domain/credentials";
import { EMAIL_RE } from "@/lib/domain/locations";
import { DEMO_CREDENTIALS } from "@/lib/mock";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

type Notice = "none" | "not_activated" | "invalid";

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const demo = useDemo();
  const [mode, setMode] = useState<"broker" | "admin">(params.get("as") === "admin" ? "admin" : "broker");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [notice, setNotice] = useState<Notice>("none");
  const [busy, setBusy] = useState(false);
  const justReset = params.get("reset") === "1";

  useEffect(() => {
    if (demo.hydrated && demo.state.session) {
      router.replace(demo.state.session.role === "admin" ? "/admin/brokers" : "/broker/dashboard");
    }
  }, [demo.hydrated, demo.state.session, router]);

  const fillDemo = () => {
    setEmail(mode === "admin" ? DEMO_CREDENTIALS.adminEmail : DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setErrors({});
    setNotice("none");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    const er: typeof errors = {};
    if (!em) er.email = "Email is required.";
    else if (!EMAIL_RE.test(em)) er.email = "Enter a valid email address.";
    if (!password) er.password = "Password is required.";
    setErrors(er);
    setNotice("none");
    if (Object.keys(er).length) return;

    setBusy(true);
    await new Promise((r) => setTimeout(r, 450));
    setBusy(false);

    if (em === DEMO_CREDENTIALS.notActivatedEmail) {
      setNotice("not_activated");
      return;
    }
    const kind = knownAccount(demo.state, em);
    const okMode = mode === "admin" ? kind === "admin" : kind === "broker" || kind === "registered";
    if (!okMode || expectedPassword(demo.state, em) !== password) {
      setNotice("invalid");
      return;
    }
    if (mode === "broker") demo.setPreviewNewBroker(kind === "registered");
    demo.signIn(mode, em);
    router.push(mode === "admin" ? "/admin/brokers" : "/broker/dashboard");
  };

  return (
    <div>
      <h1 className="text-[28px] font-bold leading-tight text-navy-950">
        {mode === "admin" ? "C2V Admin sign in" : "Welcome back"}
      </h1>
      <p className="mt-2 text-[15px] text-slate-500">
        {mode === "admin"
          ? "Sign in to monitor Brokers, commissions and payouts."
          : "Sign in to your broker account to track your network and earnings."}
      </p>

      <div className="mt-6 space-y-3 empty:hidden">
        {justReset && (
          <Callout tone="success" title="Password updated">
            Sign in with your new password.
          </Callout>
        )}
        {notice === "not_activated" && (
          <Callout tone="warning" title="Your Broker account is not activated yet">
            Jordan, your invitation from Town Square Realty hasn&apos;t been accepted. Use the activation link in your invitation email, or contact C2V Broker Support at broker-support@client2vendor.com or (800) 555-0135.
          </Callout>
        )}
        {notice === "invalid" && (
          <Callout tone="danger" title="Email or password is incorrect">
            Check your details and try again. After 5 failed attempts your account is locked for 15 minutes.
          </Callout>
        )}
      </div>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <div>
          <AuthLabel htmlFor="login-email">{mode === "admin" ? "Work email" : "Business email"}</AuthLabel>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }}
            placeholder="e.g. name@yourbrokerage.com"
            className={cn(AUTH_INPUT, errors.email && "border-rose-400 focus:border-rose-500 focus:ring-rose-100")}
          />
          {errors.email && <p role="alert" className="mt-1.5 text-xs text-rose-600">{errors.email}</p>}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="login-password" className="text-[13px] font-semibold uppercase tracking-wide text-navy-900">Password</label>
            <Link href={`/broker/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ""}`} className="text-sm font-semibold text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); }}
            placeholder="Enter your password"
            invalid={!!errors.password}
          />
          {errors.password && <p role="alert" className="mt-1.5 text-xs text-rose-600">{errors.password}</p>}
        </div>
        <AuthButton type="submit" disabled={busy} className="mt-2 w-full">{busy ? "Signing in…" : "Sign in"}</AuthButton>
      </form>

      {mode === "broker" && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">New to Client2Vendor?</p>
          <Link
            href="/broker/register"
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border-2 border-brand-600 bg-white text-[15px] font-semibold text-brand-700 hover:bg-brand-50"
          >
            Create your broker account
          </Link>
        </div>
      )}
      <p className="mt-2 text-center text-sm">
        <button
          type="button"
          onClick={() => { setMode((m) => (m === "broker" ? "admin" : "broker")); setNotice("none"); setErrors({}); }}
          className="font-medium text-slate-500 hover:text-brand-700 hover:underline"
        >
          {mode === "broker" ? "C2V Admin sign in" : "Back to Broker sign in"}
        </button>
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-sun/70 bg-sun-50/60 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-navy-950">
          <KeyRound className="h-4 w-4 text-olive" aria-hidden="true" />
          Demo credentials
        </p>
        <p className="mt-1 break-all text-slate-600">
          {mode === "admin" ? DEMO_CREDENTIALS.adminEmail : DEMO_CREDENTIALS.email} ·{" "}
          <span className="font-mono">{DEMO_CREDENTIALS.password}</span>
        </p>
        {mode === "broker" && (
          <p className="mt-1 text-xs text-slate-500">
            Try <span className="font-mono">{DEMO_CREDENTIALS.notActivatedEmail}</span> for the not-activated state.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <button type="button" onClick={fillDemo} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            Fill in demo credentials
          </button>
          {mode === "broker" && (
            <button
              type="button"
              onClick={() => {
                demo.setPreviewNewBroker(true);
                demo.signIn("broker", DEMO_CREDENTIALS.email);
                router.push("/broker/dashboard");
              }}
              className="font-semibold text-brand-700 underline-offset-2 hover:underline"
            >
              Sign in as a first-time Broker (empty dashboard)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
