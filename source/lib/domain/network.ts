import { addDays, daysBetween, monthKey } from "@/lib/domain/dates";
import { DEMO_TODAY, PLANS } from "@/lib/domain/policy";
import type {
  Agent,
  BrokerDataset,
  Cents,
  MonthKey,
  PlanId,
  Vendor,
} from "@/lib/domain/types";
import { createRng } from "@/lib/mock/prng";

/* ------------------------------------------------------------------ */
/* Offices                                                            */
/* ------------------------------------------------------------------ */

export type Office = { name: string; branch: string; address: string };

const OFFICE_ADDRESSES: Record<string, string> = {
  "Downtown Austin": "500 Congress Ave, Suite 100, Austin, TX 78701",
  "Round Rock": "201 E Main St, Suite 210, Round Rock, TX 78664",
  Westlake: "3801 N Capital of Texas Hwy, Suite E-240, Austin, TX 78746",
  "Cedar Park": "1890 Ranch Shopping Center, Suite 300, Cedar Park, TX 78613",
  "Main Office": "100 Main St, Suite 1, Austin, TX 78701",
};

export function officesFor(d: BrokerDataset): Office[] {
  const names = Array.from(new Set(d.agents.map((a) => a.office)));
  const all = names.length ? names : Object.keys(OFFICE_ADDRESSES).slice(0, 4);
  return all.sort().map((name) => ({
    name,
    branch: `${name} Branch`,
    address: OFFICE_ADDRESSES[name] ?? "Austin, TX",
  }));
}

/** Town Square's office list, used even before any Agent has joined. */
export const BROKER_OFFICES: Office[] = [
  "Downtown Austin",
  "Round Rock",
  "Westlake",
  "Cedar Park",
].map((name) => ({
  name,
  branch: `${name} Branch`,
  address: OFFICE_ADDRESSES[name],
}));

/* ------------------------------------------------------------------ */
/* Deterministic helpers                                              */
/* ------------------------------------------------------------------ */

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngFor(key: string) {
  return createRng(hash(key));
}

/* ------------------------------------------------------------------ */
/* Agent ↔ Vendor attribution                                         */
/* ------------------------------------------------------------------ */

/**
 * Which connected Agent introduced each referred Vendor. Skewed so a handful
 * of Agents bring most Vendors, as in a real brokerage.
 */
export function vendorAgentMap(d: BrokerDataset): Map<string, string> {
  const pool = d.agents
    .filter((a) => a.status !== "invited")
    .sort((a, b) => a.id.localeCompare(b.id));
  const map = new Map<string, string>();
  if (!pool.length) return map;
  const ranked = [...pool].sort((a, b) => hash(a.id) - hash(b.id));
  for (const v of d.vendors) {
    const u = (hash(v.id) % 10_000) / 10_000;
    const idx = Math.min(ranked.length - 1, Math.floor(ranked.length * u ** 2.6));
    map.set(v.id, ranked[idx].id);
  }
  return map;
}

export type AgentDisplayStatus =
  | "top_performer"
  | "active"
  | "new"
  | "inactive"
  | "invited";

export const AGENT_DISPLAY: Record<
  AgentDisplayStatus,
  { label: string; className: string }
> = {
  top_performer: {
    label: "Top Performer",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  },
  active: {
    label: "Active",
    className: "bg-brand-50 text-brand-700 ring-brand-600/15",
  },
  new: { label: "New", className: "bg-slate-100 text-slate-600 ring-slate-500/15" },
  inactive: {
    label: "Inactive",
    className: "bg-rose-50 text-rose-700 ring-rose-600/15",
  },
  invited: {
    label: "Invited",
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
  },
};

export type AgentRow = {
  agent: Agent;
  display: AgentDisplayStatus;
  referrals: number;
  vendors: number;
  transactions: number;
  earningsCents: Cents;
};

export function agentTransactionCount(agent: Agent): number {
  if (agent.status === "invited") return 0;
  const r = rngFor(`tx-${agent.id}`);
  return agent.status === "inactive" ? r.int(0, 2) : r.int(1, 9);
}

/** Per-Agent network metrics. `period` limits activity to one month. */
export function agentRows(
  d: BrokerDataset,
  period: MonthKey | "all" = "all",
): AgentRow[] {
  const attribution = vendorAgentMap(d);
  const activeSubs = new Set(
    d.subscriptions
      .filter((s) => s.status === "active" && s.planId)
      .map((s) => s.vendorId),
  );
  const byAgent = new Map<
    string,
    { referrals: number; vendors: number; earnings: Cents }
  >();
  const bucket = (id: string) => {
    let b = byAgent.get(id);
    if (!b) byAgent.set(id, (b = { referrals: 0, vendors: 0, earnings: 0 }));
    return b;
  };
  for (const v of d.vendors) {
    const agentId = attribution.get(v.id);
    if (!agentId) continue;
    const inPeriod = period === "all" || monthKey(v.registeredAt) === period;
    if (inPeriod) bucket(agentId).referrals += 1;
    if (inPeriod && activeSubs.has(v.id)) bucket(agentId).vendors += 1;
  }
  for (const t of d.transactions) {
    const agentId = attribution.get(t.vendorId);
    if (!agentId) continue;
    if (period !== "all" && t.periodMonth !== period) continue;
    bucket(agentId).earnings += t.commissionCents;
  }

  const rows: AgentRow[] = d.agents.map((agent) => {
    const b = byAgent.get(agent.id) ?? { referrals: 0, vendors: 0, earnings: 0 };
    return {
      agent,
      display: agent.status === "invited" ? "invited" : agent.status === "inactive" ? "inactive" : "active",
      referrals: b.referrals,
      vendors: b.vendors,
      transactions: agentTransactionCount(agent),
      earningsCents: b.earnings,
    };
  });

  // Top performers: the ten highest all-time earners among active Agents.
  const allTime = period === "all" ? rows : agentRows(d, "all");
  const top = new Set(
    allTime
      .filter((r) => r.display === "active" && r.earningsCents > 0)
      .sort((a, b) => b.earningsCents - a.earningsCents)
      .slice(0, 10)
      .map((r) => r.agent.id),
  );
  for (const r of rows) {
    if (r.display !== "active") continue;
    if (top.has(r.agent.id)) r.display = "top_performer";
    else if (daysBetween(r.agent.joinedAt, DEMO_TODAY) <= 30) r.display = "new";
  }
  return rows;
}

export function agentSummary(d: BrokerDataset) {
  const agents = d.agents;
  const connected = agents.filter((a) => a.status !== "invited");
  const thisMonth = monthKey(DEMO_TODAY);
  return {
    total: connected.length,
    offices: new Set(connected.map((a) => a.office)).size,
    active: agents.filter((a) => a.status === "active").length,
    newThisMonth: agents.filter(
      (a) => a.status !== "invited" && monthKey(a.joinedAt) === thisMonth,
    ).length,
    invitedThisMonth: agents.filter(
      (a) => a.status === "invited",
    ).length,
    inactive: agents.filter((a) => a.status === "inactive").length,
  };
}

/* ------------------------------------------------------------------ */
/* Agent profile                                                      */
/* ------------------------------------------------------------------ */

export function agentProfile(agent: Agent) {
  const r = rngFor(`profile-${agent.id}`);
  const area = r.pick(["512", "737", "254"]);
  return {
    phone: `(${area}) ${r.int(200, 989)}-${String(r.int(0, 9999)).padStart(4, "0")}`,
    licenseNumber: String(r.int(400_000, 799_999)),
    licenseSince: Number(agent.joinedAt.slice(0, 4)) - r.int(1, 9),
  };
}

export type AgentVendorRow = {
  vendor: Vendor;
  status: "active" | "past_due" | "trial" | "canceled" | "free";
  planId: PlanId | null;
  earningsCents: Cents;
};

export function agentVendors(d: BrokerDataset, agentId: string): AgentVendorRow[] {
  const attribution = vendorAgentMap(d);
  return d.vendors
    .filter((v) => attribution.get(v.id) === agentId)
    .map((vendor) => {
      const sub = d.subscriptions.find((s) => s.vendorId === vendor.id);
      const status: AgentVendorRow["status"] =
        sub?.status === "active"
          ? "active"
          : sub?.status === "past_due"
            ? "past_due"
            : sub?.status === "trial"
              ? "trial"
              : sub?.status === "free" || sub?.status === "none"
                ? "free"
                : "canceled";
      return {
        vendor,
        status,
        planId: sub?.planId ?? null,
        earningsCents: d.transactions
          .filter((t) => t.vendorId === vendor.id)
          .reduce((s, t) => s + t.commissionCents, 0),
      };
    })
    .sort((a, b) => b.earningsCents - a.earningsCents);
}

export const VENDOR_STATUS_DISPLAY: Record<
  AgentVendorRow["status"],
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
  past_due: { label: "Past Due", className: "bg-amber-50 text-amber-800" },
  trial: { label: "Trial", className: "bg-sky-50 text-sky-700" },
  canceled: { label: "Canceled", className: "bg-slate-100 text-slate-600" },
  free: { label: "Free plan", className: "bg-slate-100 text-slate-600" },
};

export function planName(id: PlanId | null) {
  return id ? PLANS[id].name : "—";
}

/* ------------------------------------------------------------------ */
/* Agent real-estate transactions (read-only view for the Broker)     */
/* ------------------------------------------------------------------ */

const CLIENT_FIRST = ["Skylar", "Jordan", "Avery", "Morgan", "Riley", "Casey", "Taylor", "Quinn", "Harper", "Reese", "Rowan", "Elliot"];
const CLIENT_LAST = ["Saris", "Bennett", "Okafor", "Nguyen", "Patel", "Ramirez", "Lindqvist", "Hughes", "Moreau", "Castillo", "Brooks", "Ito"];
const STREETS = ["Maple Ave", "Barton Springs Rd", "Rainey St", "S Lamar Blvd", "Oak Hollow Dr", "Bee Cave Rd", "Palm Valley Blvd", "Whitestone Blvd", "Mesa Dr", "Westlake Dr"];
const TOWNS = [
  ["Austin", "78704"],
  ["Round Rock", "78664"],
  ["Cedar Park", "78613"],
  ["West Lake Hills", "78746"],
  ["Pflugerville", "78660"],
  ["Georgetown", "78626"],
];
const TASKS = [
  "I need someone to check my financial documents",
  "Schedule a full home inspection before the option period ends",
  "Need a title search and closing coordination",
  "Looking for a roof inspection and repair estimate",
  "Coordinate appraisal and mortgage underwriting",
];

export type RealEstateTxn = {
  id: string;
  number: string;
  client: string;
  address: string;
  type: "buyer" | "seller";
  createdAt: string;
  task: string;
  milestone: number; // 0..4
};

export const MILESTONES = [
  "Under contract",
  "Inspection",
  "Appraisal",
  "Financing approved",
  "Closing",
];

export function agentTransactions(agent: Agent): RealEstateTxn[] {
  const n = agentTransactionCount(agent);
  const r = rngFor(`re-${agent.id}`);
  const base = hash(agent.id) % 9_000;
  return Array.from({ length: n }, (_, i) => {
    const [town, zip] = r.pick(TOWNS);
    return {
      id: `${agent.id}_t${i + 1}`,
      number: `F${String(base + i * 7 + 1).padStart(7, "0")}`,
      client: `${r.pick(CLIENT_FIRST)} ${r.pick(CLIENT_LAST)}`,
      address: `${r.int(100, 9899)}, ${r.pick(STREETS)}, ${town}, Texas, ${zip}`,
      type: r.next() < 0.6 ? ("buyer" as const) : ("seller" as const),
      createdAt: addDays(DEMO_TODAY, -r.int(3, 240)),
      task: r.pick(TASKS),
      milestone: r.int(0, 4),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type TeamMember = {
  company: string;
  contact: string;
  status: "pending" | "accepted";
  preferred: boolean;
  vendorId?: string;
};

export type TeamGroup = { category: string; members: TeamMember[] };

/** The Agent's working team on a transaction, drawn from the Broker's Vendors. */
export function transactionTeam(
  d: BrokerDataset,
  txn: RealEstateTxn,
  side: "buyer" | "seller",
): TeamGroup[] {
  const r = rngFor(`team-${txn.id}-${side}`);
  const cats =
    side === "buyer"
      ? ["Attorney", "Mortgage", "Home Inspection", "Septic Inspectors"]
      : ["Attorney", "Title", "Photography", "Staging"];
  const pool = d.vendors;
  return cats.map((category, ci) => {
    const count = ci === cats.length - 1 ? 0 : r.int(1, 2);
    const members: TeamMember[] = Array.from({ length: count }, () => {
      const v = pool.length ? r.pick(pool) : undefined;
      return {
        company: v?.companyName ?? `${category} partner`,
        contact: v?.contactName ?? "Invitation pending",
        status: r.next() < 0.65 ? "pending" : "accepted",
        preferred: r.next() < 0.5,
        vendorId: v?.id,
      };
    });
    return { category, members };
  });
}

export type TxnDocument = {
  name: string;
  kind: "PDF" | "DOC" | "DOCX" | "CSV";
  size: string;
  by: string;
  at: string;
};

export function transactionDocuments(txn: RealEstateTxn): TxnDocument[] {
  const r = rngFor(`docs-${txn.id}`);
  const people = ["Robert Fox", "Jacob Jones", "Brad Cooper", "Lisa Smith", "Dana Ortiz"];
  const docs: Omit<TxnDocument, "by" | "at">[] = [
    { name: "Home_Inspection_Report.pdf", kind: "PDF", size: "25 MB" },
    { name: "Mortgage_Pre_Approval.doc", kind: "DOC", size: "300 KB" },
    { name: "Property_Photos.pdf", kind: "PDF", size: "5 MB" },
    { name: "Financial_sheet.csv", kind: "CSV", size: "2 MB" },
    { name: "Inspection_Report.docx", kind: "DOCX", size: "150 KB" },
  ];
  return docs.map((doc, i) => ({
    ...doc,
    by: r.pick(people),
    at: addDays(txn.createdAt, i + 1),
  }));
}

/* ------------------------------------------------------------------ */
/* Dashboard helpers                                                  */
/* ------------------------------------------------------------------ */

export type CategorySlice = { category: string; count: number; share: number };

export function vendorCategories(d: BrokerDataset, maxSlices = 5): CategorySlice[] {
  const counts = new Map<string, number>();
  for (const v of d.vendors) counts.set(v.trade, (counts.get(v.trade) ?? 0) + 1);
  const total = d.vendors.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxSlices)
    .map(([category, count]) => ({ category, count, share: count / total }));
}

export function categoryCount(d: BrokerDataset) {
  return new Set(d.vendors.map((v) => v.trade)).size;
}

export type ActivityItem = {
  id: string;
  kind: "subscribed" | "agent_joined" | "vendor_joined" | "agent_invite" | "vendor_invite" | "import";
  text: string;
  /** ISO date-time; demo-generated items use the real clock. */
  at: string;
  live?: boolean;
};

export function networkActivity(d: BrokerDataset): ActivityItem[] {
  const items: ActivityItem[] = [];
  const planOf = new Map(d.subscriptions.map((s) => [s.vendorId, s]));
  for (const v of d.vendors) {
    items.push({
      id: `vj_${v.id}`,
      kind: "vendor_joined",
      text: `${v.companyName} joined from your referral link`,
      at: `${v.registeredAt}T15:00:00Z`,
    });
    const s = planOf.get(v.id);
    if (s?.firstPaidAt && s.planId)
      items.push({
        id: `vs_${v.id}`,
        kind: "subscribed",
        text: `${v.companyName} subscribed to the ${PLANS[s.planId].name} plan`,
        at: `${s.firstPaidAt}T17:30:00Z`,
      });
  }
  for (const a of d.agents) {
    if (a.status === "invited") continue;
    items.push({
      id: `aj_${a.id}`,
      kind: "agent_joined",
      text: `${a.name} joined your broker network (${a.office})`,
      at: `${a.joinedAt}T14:00:00Z`,
    });
  }
  return items
    .filter((i) => i.at.slice(0, 10) <= DEMO_TODAY)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function relativeTime(item: Pick<ActivityItem, "at" | "live">): string {
  if (item.live) {
    const mins = Math.max(0, Math.round((Date.now() - Date.parse(item.at)) / 60_000));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const h = Math.round(mins / 60);
    return h < 24 ? `${h} hour${h === 1 ? "" : "s"} ago` : `${Math.round(h / 24)} days ago`;
  }
  const days = daysBetween(item.at.slice(0, 10), DEMO_TODAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}
