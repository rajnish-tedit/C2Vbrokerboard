import { Link2, Users } from "lucide-react";
import Link from "next/link";

import { C2VLogo } from "@/components/shell/BrokerTopNav";
import { cn } from "@/lib/utils";

const POINTS = [
  { title: "Grow through your agents", body: "Give every agent a trackable way to refer trusted vendors." },
  { title: "See the entire network", body: "Understand which offices and agents drive vendor growth." },
  { title: "Earn as vendors grow", body: "Track eligible subscription revenue and payouts clearly." },
];

function NetworkDiagram() {
  return (
    <div className="relative mt-8 h-44 w-72" aria-hidden="true">
      <svg viewBox="0 0 288 176" className="absolute inset-0 h-full w-full" fill="none">
        <path d="M 78 88 H 100 V 36 H 124" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M 78 88 H 100 V 140 H 124" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
      <span className="absolute left-0 top-1/2 flex h-[78px] w-[78px] -translate-y-1/2 items-center justify-center rounded-full bg-sun text-sm font-extrabold tracking-wide text-navy-950 shadow-[0_8px_24px_rgba(255,201,60,0.35)]">
        YOU
      </span>
      {[
        { label: "Vendors", icon: <Link2 className="h-4 w-4" />, top: 4 },
        { label: "Agents", icon: <Users className="h-4 w-4" />, top: 108 },
      ].map((n) => (
        <span
          key={n.label}
          className="absolute left-[124px] flex h-16 w-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 text-[11px] text-white/85"
          style={{ top: n.top }}
        >
          {n.icon}
          {n.label}
        </span>
      ))}
    </div>
  );
}

export function AuthPanel() {
  return (
    <aside className="relative hidden flex-col overflow-hidden bg-gradient-to-b from-[#2b4170] to-[#3f5ea6] px-12 py-10 text-white lg:flex">
      <div className="pointer-events-none absolute -right-40 top-24 h-[34rem] w-[34rem] rounded-full border-[70px] border-white/[0.04]" aria-hidden="true" />
      <Link href="/broker/login" aria-label="Client2Vendor"><C2VLogo /></Link>
      <p className="mt-14 text-xs font-bold uppercase tracking-[0.2em] text-sun">Welcome to C2V</p>
      <h2 className="mt-4 max-w-md text-4xl font-bold leading-tight">Build Your Broker Network</h2>
      <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/80">
        Connect your offices, agents, and vendor partners in one trusted referral platform.
      </p>
      <NetworkDiagram />
      <ol className="mt-8 space-y-5">
        {POINTS.map((p, i) => (
          <li key={p.title} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sun text-xs font-bold text-navy-950">{i + 1}</span>
            <span>
              <span className="block text-[17px] font-semibold">{p.title}</span>
              <span className="block text-sm text-white/65">{p.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-auto pt-8">
        <div className="flex items-center gap-5 rounded-xl border border-white/10 bg-white/[0.06] px-6 py-5">
          <span className="num text-5xl font-bold text-sun">35%</span>
          <span>
            <span className="block font-semibold">Broker revenue share</span>
            <span className="block text-xs text-white/70">Earn 35% of eligible vendor subscription revenue for the monetisation period.</span>
          </span>
        </div>
        <p className="mt-6 text-center text-sm text-white/75">
          Secure onboarding · Stripe-powered payouts · Your data stays private
        </p>
      </div>
    </aside>
  );
}

export function AuthLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <AuthPanel />
      <section className="flex flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-10">
        <Link href="/broker/login" aria-label="Client2Vendor" className="mb-6 inline-block rounded-lg bg-brand-800 px-3 py-2 lg:hidden">
          <C2VLogo />
        </Link>
        <div className={cn("mx-auto flex w-full max-w-xl flex-1 flex-col justify-center", className)}>{children}</div>
      </section>
    </main>
  );
}

/** Uppercase field label used across the auth screens. */
export function AuthLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-navy-900">
      {children}
    </label>
  );
}

export const AUTH_INPUT =
  "block h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-[15px] text-navy-950 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function AuthButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "mx-auto block h-14 min-w-[17rem] rounded-xl bg-gradient-to-b from-[#2f4c8a] to-[#4560a2] px-8 text-[15px] font-semibold text-white shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
