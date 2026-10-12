import {
  Bell,
  Building2,
  CircleUser,
  History,
  Landmark,
  LayoutDashboard,
  Link2,
  Receipt,
  SlidersHorizontal,
  Store,
  TriangleAlert,
  Users,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Bell;
  badge?: "notifications" | "stripe" | "exceptions";
};

export type NavGroup = { label: string; items: NavItem[] };

export const BROKER_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/broker/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "My Network",
    items: [
      { href: "/broker/agents", label: "Agents", icon: Users },
      { href: "/broker/vendors", label: "Vendors", icon: Store },
    ],
  },
  {
    label: "Affiliate Program",
    items: [
      { href: "/broker/referrals", label: "Referral Link & Code", icon: Link2 },
    ],
  },
  {
    label: "Financials",
    items: [
      { href: "/broker/commissions", label: "Commissions", icon: Receipt },
      { href: "/broker/payouts", label: "Payouts & Statements", icon: Wallet },
    ],
  },
  {
    label: "Account",
    items: [
      {
        href: "/broker/payout-settings",
        label: "Payout Settings",
        icon: Landmark,
        badge: "stripe",
      },
      {
        href: "/broker/notifications",
        label: "Notifications",
        icon: Bell,
        badge: "notifications",
      },
      { href: "/broker/profile", label: "Profile", icon: CircleUser },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Broker & Commission Manager",
    items: [
      { href: "/admin/brokers", label: "Brokers", icon: Building2 },
      { href: "/admin/referrals", label: "Broker Referrals", icon: Link2 },
      {
        href: "/admin/configuration",
        label: "Commission Configuration",
        icon: SlidersHorizontal,
      },
      {
        href: "/admin/commissions",
        label: "Commission Transactions",
        icon: Receipt,
      },
      { href: "/admin/payouts", label: "Payout Batches", icon: ArrowLeftRight },
      {
        href: "/admin/exceptions",
        label: "Payout Exceptions",
        icon: TriangleAlert,
        badge: "exceptions",
      },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: History },
    ],
  },
];
