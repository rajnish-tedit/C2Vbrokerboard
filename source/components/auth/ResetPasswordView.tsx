"use client";

import { CircleCheck, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthButton, AuthLabel, AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput, StrengthMeter } from "@/components/auth/PasswordInput";
import { knownAccount } from "@/lib/domain/credentials";
import { useDemo } from "@/lib/store/DemoProvider";

export function ResetPasswordView() {
  const params = useSearchParams();
  const router = useRouter();
  const demo = useDemo();
  const email = (params.get("email") ?? "").trim().toLowerCase();
  const valid = params.get("token") === "demo" && knownAccount(demo.state, email) !== null;

  const [password, setPassword] = useState("NewTown#2027");
  const [confirm, setConfirm] = useState("NewTown#2027");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (password.length < 8) er.password = "Use at least 8 characters.";
    if (confirm !== password) er.confirm = "Passwords do not match.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    demo.setPassword(email, password);
    setBusy(false);
    setDone(true);
  };

  return (
    <AuthLayout>
      <div className="w-full">
        {!valid ? (
          <div className="space-y-5" role="alert">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <LinkIcon className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="text-[28px] font-bold leading-tight text-navy-950">This reset link has expired</h1>
            <p className="text-[15px] text-slate-600">The link is invalid or has already been used. Request a new one to continue.</p>
            <AuthButton type="button" onClick={() => router.push("/broker/forgot-password")} className="w-full">Request a new link</AuthButton>
          </div>
        ) : done ? (
          <div className="space-y-6" role="status">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CircleCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-navy-950">Password updated</h1>
              <p className="mt-2 text-[15px] text-slate-600">Your password for <span className="font-semibold text-navy-950">{email}</span> has been changed. Sign in with your new password.</p>
            </div>
            <AuthButton type="button" onClick={() => router.push(`/broker/login?email=${encodeURIComponent(email)}&reset=1`)} className="w-full">Continue to sign in</AuthButton>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-navy-950">Set a new password</h1>
              <p className="mt-2 text-[15px] text-slate-500">Choose a new password for <span className="font-semibold text-navy-950">{email}</span>.</p>
            </div>
            <div>
              <AuthLabel htmlFor="rp-password">New password</AuthLabel>
              <PasswordInput id="rp-password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); }} placeholder="At least 8 characters.." invalid={!!errors.password} />
              <StrengthMeter value={password} />
              {errors.password && <p role="alert" className="mt-1.5 text-xs text-rose-600">{errors.password}</p>}
            </div>
            <div>
              <AuthLabel htmlFor="rp-confirm">Confirm new password</AuthLabel>
              <PasswordInput id="rp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setErrors((x) => ({ ...x, confirm: undefined })); }} placeholder="Repeat your new password" invalid={!!errors.confirm} />
              {errors.confirm && <p role="alert" className="mt-1.5 text-xs text-rose-600">{errors.confirm}</p>}
            </div>
            <AuthButton type="submit" disabled={busy} className="w-full">{busy ? "Updating…" : "Reset password"}</AuthButton>
            <p className="text-center text-sm"><Link href="/broker/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link></p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
