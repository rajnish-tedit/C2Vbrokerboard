"use client";

import { FlaskConical, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatDate } from "@/lib/domain/dates";
import { DEMO_TODAY } from "@/lib/domain/policy";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn, initials } from "@/lib/utils";

import { BrokerTopNav } from "./BrokerTopNav";
import { DemoControls } from "./DemoControls";
import { ADMIN_NAV, type NavGroup } from "./navigation";

type AppShellProps = { role: "broker" | "admin"; children: React.ReactNode };

function Logo({ subtitle }: { subtitle: string }) {
  return (
    <div>
      <p className="text-lg font-bold tracking-tight text-white">
        Client<span className="text-gold">2</span>Vendor
      </p>
      <p className="text-[11px] font-medium uppercase tracking-widest text-navy-300">
        {subtitle}
      </p>
    </div>
  );
}

function SidebarNav({
  groups,
  onNavigate,
}: {
  groups: NavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { unreadCount, broker, brokers } = useDemo();
  const stripeNeedsAction =
    broker.payoutAccount.onboardingStatus !== "connected";
  const exceptions = brokers.filter(
    (b) =>
      b.payoutAccount.onboardingStatus !== "connected" ||
      b.payoutBatches.some(
        (p) => p.bankPayoutStatus === "failed" || p.batchStatus === "on_hold",
      ),
  ).length;

  return (
    <nav aria-label="Main" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-navy-400">
            {group.label}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const badge =
                item.badge === "notifications" && unreadCount > 0
                  ? String(unreadCount)
                  : item.badge === "exceptions" && exceptions > 0
                    ? String(exceptions)
                    : null;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/10 text-white"
                        : "text-navy-200 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {active && (
                      <span
                        className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-gold"
                        aria-hidden="true"
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 leading-tight">{item.label}</span>
                    {badge && (
                      <span className="num rounded-full bg-gold px-1.5 text-[11px] font-semibold text-navy-950">
                        {badge}
                      </span>
                    )}
                    {item.badge === "stripe" && stripeNeedsAction && (
                      <span
                        className="h-2 w-2 rounded-full bg-rose-400"
                        aria-label="Action needed"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ role, children }: AppShellProps) {
  const demo = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const session = demo.state.session;

  useEffect(() => {
    if (!demo.hydrated) return;
    if (!session)
      router.replace(`/broker/login${role === "admin" ? "?as=admin" : ""}`);
    else if (session.role !== role)
      router.replace(
        session.role === "admin" ? "/admin/brokers" : "/broker/dashboard",
      );
  }, [demo.hydrated, session, role, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (!demo.hydrated || !session || session.role !== role) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm text-slate-500"
        role="status"
      >
        Loading prototype…
      </div>
    );
  }

  if (role === "broker") {
    return (
      <div className="min-h-screen bg-white">
        <BrokerTopNav onOpenControls={() => setControlsOpen(true)} />
        <main className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
        <DemoControls
          open={controlsOpen}
          onClose={() => setControlsOpen(false)}
        />
      </div>
    );
  }

  const groups = ADMIN_NAV;
  const user = { name: "Sarah Kim", sub: "C2V Admin · Operations" };

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 px-3 py-5">
      <div className="px-3">
        <Logo subtitle="Admin Console" />
      </div>
      <div className="mt-6 flex-1 overflow-y-auto">
        <SidebarNav groups={groups} onNavigate={() => setMobileOpen(false)} />
      </div>
      <button
        type="button"
        onClick={() => {
          demo.signOut();
          router.push("/broker/login");
        }}
        className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-navy-200 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block print:!hidden">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-950/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw]">
            <button
              type="button"
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-navy-200 hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-20 flex h-14 print:hidden items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-1.5 text-navy-900 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="hidden items-center gap-1.5 rounded-full bg-gold-50 px-2.5 py-1 text-xs font-medium text-gold-700 ring-1 ring-inset ring-gold-200 sm:inline-flex">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Prototype · simulated data
          </span>
          <span className="num hidden text-xs text-slate-500 md:inline">
            Demo date: {formatDate(DEMO_TODAY)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setControlsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-slate-50"
            >
              <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              Demo controls
            </button>
            <div className="flex items-center gap-2 pl-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                {initials(user.name)}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-sm font-medium text-navy-950">
                  {user.name}
                </span>
                <span className="block text-xs text-slate-500">{user.sub}</span>
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <DemoControls
        open={controlsOpen}
        onClose={() => setControlsOpen(false)}
      />
    </div>
  );
}
