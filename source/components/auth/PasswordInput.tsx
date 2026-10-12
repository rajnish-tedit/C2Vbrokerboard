"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { AUTH_INPUT } from "@/components/auth/AuthLayout";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { invalid?: boolean };

export function PasswordInput({ invalid, className, ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={cn(AUTH_INPUT, "pr-12", invalid && "border-rose-400 focus:border-rose-500 focus:ring-rose-100", className)}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-brand-700 hover:bg-brand-50"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

/** Simple strength meter: length, mix of cases, digits, symbols. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

export function StrengthMeter({ value }: { value: string }) {
  if (!value) return null;
  const { score, label } = passwordStrength(value);
  const colors = ["bg-rose-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= score ? colors[score] : "bg-slate-200")} />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500">Password strength: {label}</p>
    </div>
  );
}
