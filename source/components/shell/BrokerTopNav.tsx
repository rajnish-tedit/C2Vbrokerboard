"use client";

import {
  Bell,
  ChevronDown,
  CircleUser,
  FlaskConical,
  Landmark,
  Link2,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useDemo } from "@/lib/store/DemoProvider";
import { cn, initials } from "@/lib/utils";

export const BROKER_TOP_NAV = [
  { href: "/broker/dashboard", label: "Dashboard" },
  { href: "/broker/agents", label: "Agents" },
  { href: "/broker/vendors", label: "Referred Vendors" },
  { href: "/broker/commissions", label: "Revenues" },
  { href: "/broker/payouts", label: "Payouts" },
] as const;

export function C2VLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold tracking-tight text-white",
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <circle cx="16" cy="16" r="13" fill="none" stroke="#FFC93C" strokeWidth="2.5" strokeDasharray="62 20" strokeLinecap="round" transform="rotate(35 16 16)" />
        <text x="16" y="20.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFC93C" fontFamily="DM Sans, system-ui, sans-serif">
          2V
        </text>
      </svg>
      <span className="text-[17px] leading-none">
        CLIENT<span className="text-sun">2</span>VENDOR
      </span>
    </span>
  );
}

type Props = { onOpenControls: () => void };

export function BrokerTopNav({ onOpenControls }: Props) {
  const demo = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const name = demo.user.name;
  const company = demo.broker.broker.companyName;

  useEffect(() => {
    setMenu(false);
    setMobile(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/broker/vendors?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-30 brand-bar text-white shadow-md print:hidden">
      <div className="mx-auto flex h-16 max-w-[96rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden"
          onClick={() => setMobile((v) => !v)}
          aria-label={mobile ? "Close navigation" : "Open navigation"}
        >
          {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/broker/dashboard" aria-label="Client2Vendor home">
          <C2VLogo />
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
          {BROKER_TOP_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors hover:text-white",
                  active
                    ? "font-semibold text-white"
                    : "font-normal text-white/80",
                )}
              >
                {item.label}
                {active && (
                  <span className="mt-0.5 block h-0.5 rounded bg-sun" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <form onSubmit={search} role="search" className="hidden md:block">
            <label className="relative block">
              <span className="sr-only">Search agents, vendors, referrals</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="global-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search agents, vendors, referrals…"
                className="h-10 w-56 rounded-lg border-0 bg-white pl-9 pr-3 text-sm text-navy-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sun xl:w-72"
              />
            </label>
          </form>

          <button
            type="button"
            onClick={onOpenControls}
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/30 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10 sm:inline-flex"
          >
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Demo controls
          </button>

          <Link
            href="/broker/notifications"
            className="relative rounded-lg p-2 hover:bg-white/10"
            aria-label={`Notifications, ${demo.unreadCount} unread`}
          >
            <Bell className="h-5 w-5" />
            {demo.unreadCount > 0 && (
              <span className="num absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {demo.unreadCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-white/10"
            >
              {demo.state.registration?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={demo.state.registration.logo} alt="" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sun to-olive text-xs font-bold text-navy-950">
                  {initials(name)}
                </span>
              )}
              <span className="hidden text-left leading-tight sm:block">
                <span className="block whitespace-nowrap text-[13px] font-semibold">{name}</span>
                <span className="block whitespace-nowrap text-[11px] text-white/70">
                  {company}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-white/70 sm:block" />
            </button>
            {menu && (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm text-navy-950 shadow-overlay"
              >
                <div className="border-b border-slate-100 px-4 py-2.5">
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-slate-500">{company}</p>
                  <p className="num mt-1 text-xs font-medium text-brand-700">
                    Code {demo.broker.broker.referralCode}
                  </p>
                </div>
                {[
                  { href: "/broker/profile", label: "Profile", icon: CircleUser },
                  { href: "/broker/referrals", label: "Referral link & code", icon: Link2 },
                  { href: "/broker/payout-settings", label: "Payout settings", icon: Landmark },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
                  >
                    <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    onOpenControls();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50"
                >
                  <FlaskConical className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  Demo controls
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    demo.signOut();
                    router.push("/broker/login");
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2 text-left text-rose-700 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobile && (
        <nav
          aria-label="Mobile"
          className="border-t border-white/15 bg-brand-800 px-4 py-2 lg:hidden"
        >
          <form onSubmit={search} role="search" className="py-2 md:hidden">
            <input
              id="global-search-mobile"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents, vendors, referrals…"
              className="h-10 w-full rounded-lg bg-white px-3 text-sm text-navy-950"
            />
          </form>
          {BROKER_TOP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm",
                pathname.startsWith(item.href)
                  ? "bg-white/10 font-semibold"
                  : "text-white/85",
              )}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={onOpenControls}
            className="mt-1 block w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/85 sm:hidden"
          >
            Demo controls
          </button>
        </nav>
      )}
    </header>
  );
}
