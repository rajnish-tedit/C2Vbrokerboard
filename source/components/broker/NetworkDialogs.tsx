"use client";

import { Check, FileSpreadsheet, Loader2, Sparkles, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { BROKER_OFFICES } from "@/lib/domain/network";
import { DEMO_TODAY } from "@/lib/domain/policy";
import { TRADES } from "@/lib/mock/names";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------ QR dialog ------------------------------ */

function qrCells(text: string, n = 29) {
  let seed = 2166136261;
  for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 16777619) >>> 0;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const cells: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd() > 0.52));
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        const ring = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[rr][cc] = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (ring || core);
      }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);
  return cells;
}

export function QrDialog({ open, onClose, url }: { open: boolean; onClose: () => void; url: string }) {
  const cells = useMemo(() => qrCells(url), [url]);
  return (
    <Modal open={open} onClose={onClose} title="Referral QR code" size="sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <svg viewBox={`0 0 ${cells.length + 2} ${cells.length + 2}`} className="h-56 w-56 rounded-lg border border-slate-200 bg-white p-1" role="img" aria-label="QR code placeholder for your referral link" shapeRendering="crispEdges">
          {cells.map((row, r) =>
            row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c + 1} y={r + 1} width="1" height="1" fill="#1E3A7A" /> : null)),
          )}
        </svg>
        <p className="num break-all text-sm font-semibold text-navy-950">{url}</p>
        <p className="text-xs text-slate-500">Simulated QR code for the prototype. A production code would link to your referral URL.</p>
      </div>
    </Modal>
  );
}

/* --------------------------- Refer a Vendor ---------------------------- */

export function ReferVendorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const demo = useDemo();
  const toast = useToast();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  const close = () => {
    setCompany("");
    setEmail("");
    setTrade("");
    setErr({});
    onClose();
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!company.trim()) next.company = "Enter the vendor's company name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!trade) next.trade = "Choose a service category.";
    setErr(next);
    if (Object.keys(next).length) return;
    demo.logActivity({ kind: "vendor_invite", text: `You referred ${company.trim()} (${trade}) to C2V` });
    toast(`Referral sent to ${company.trim()}`);
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Refer a Vendor"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" form="refer-vendor-form" className="bg-brand-600 hover:bg-brand-700">Send referral</Button>
        </div>
      }
    >
      <form id="refer-vendor-form" onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-slate-600">
          We email the vendor your referral link with code <span className="num font-semibold text-navy-950">{demo.broker.broker.referralCode}</span>. You earn 35% when they subscribe to an eligible paid plan.
        </p>
        <div>
          <label htmlFor="rv-company" className="mb-1.5 block text-xs font-semibold text-navy-900">Company name</label>
          <input id="rv-company" className="field" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Lone Star Plumbing" />
          {err.company && <p role="alert" className="mt-1 text-xs text-rose-600">{err.company}</p>}
        </div>
        <div>
          <label htmlFor="rv-email" className="mb-1.5 block text-xs font-semibold text-navy-900">Contact email</label>
          <input id="rv-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. owner@company.com" />
          {err.email && <p role="alert" className="mt-1 text-xs text-rose-600">{err.email}</p>}
        </div>
        <div>
          <label htmlFor="rv-trade" className="mb-1.5 block text-xs font-semibold text-navy-900">Service category</label>
          <select id="rv-trade" className="field" value={trade} onChange={(e) => setTrade(e.target.value)}>
            <option value="">Select a category</option>
            {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {err.trade && <p role="alert" className="mt-1 text-xs text-rose-600">{err.trade}</p>}
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------ AI Import ------------------------------ */

type Mode = "agents" | "vendors";
type Parsed = { name: string; email: string; detail: string };

const SAMPLE_AGENTS: Parsed[] = [
  { name: "Priya Nair", email: "priya.nair@townsquarerealty.com", detail: "Downtown Austin" },
  { name: "Marcus Bell", email: "marcus.bell@townsquarerealty.com", detail: "Round Rock" },
  { name: "Elena Vasquez", email: "elena.vasquez@townsquarerealty.com", detail: "Westlake" },
  { name: "Tom Hadley", email: "tom.hadley@townsquarerealty.com", detail: "Cedar Park" },
  { name: "Aisha Rahman", email: "aisha.rahman@townsquarerealty.com", detail: "Downtown Austin" },
];
const SAMPLE_VENDORS: Parsed[] = [
  { name: "Capital City Plumbing", email: "service@capitalcityplumbing.com", detail: "Plumbing" },
  { name: "Redbud Roofing", email: "hello@redbudroofing.com", detail: "Roofing" },
  { name: "Hill Country HVAC", email: "office@hillcountryhvac.com", detail: "HVAC" },
  { name: "Brightside Inspections", email: "book@brightsideinspect.com", detail: "Home Inspection" },
  { name: "Trinity Title Co.", email: "team@trinitytitle.com", detail: "Title" },
  { name: "Live Oak Electric", email: "info@liveoakelectric.com", detail: "Electric" },
];

export function AiImportDialog({ mode, onClose }: { mode: Mode | null; onClose: () => void }) {
  const demo = useDemo();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"pick" | "reading" | "review">("pick");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Parsed[]>([]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const agents = mode === "agents";

  const reset = () => {
    setPhase("pick");
    setFileName("");
    setRows([]);
    setChosen(new Set());
  };
  const close = () => {
    reset();
    onClose();
  };

  const read = (name: string) => {
    setFileName(name);
    setPhase("reading");
    window.setTimeout(() => {
      const found = agents ? SAMPLE_AGENTS : SAMPLE_VENDORS;
      setRows(found);
      setChosen(new Set(found.map((r) => r.email)));
      setPhase("review");
    }, 1300);
  };

  const confirm = () => {
    const picked = rows.filter((r) => chosen.has(r.email));
    if (!picked.length) return;
    if (agents) {
      picked.forEach((p, i) => {
        const [first, ...rest] = p.name.split(" ");
        demo.inviteAgent({
          id: `ag_import_${Date.now()}_${i}`,
          brokerId: demo.broker.broker.id,
          name: `${first} ${rest.join(" ")}`.trim(),
          email: p.email,
          office: BROKER_OFFICES.find((o) => o.name === p.detail)?.name ?? BROKER_OFFICES[0].name,
          status: "invited",
          joinedAt: DEMO_TODAY,
          relationshipStatus: "pending",
          linkedAt: DEMO_TODAY,
        });
      });
    }
    demo.logActivity({
      kind: "import",
      text: `AI import queued ${picked.length} ${agents ? "agent" : "vendor"} invitation${picked.length === 1 ? "" : "s"} from ${fileName}`,
    });
    toast(`${picked.length} invitation${picked.length === 1 ? "" : "s"} are being sent in the background`);
    close();
  };

  const toggle = (email: string) =>
    setChosen((s) => {
      const n = new Set(s);
      if (n.has(email)) n.delete(email);
      else n.add(email);
      return n;
    });

  return (
    <Modal
      open={mode !== null}
      onClose={close}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" aria-hidden="true" />
          AI Import {agents ? "Agents" : "Vendors"}
        </span>
      }
      footer={
        phase === "review" ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{chosen.size} of {rows.length} selected</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={reset}>Choose another file</Button>
              <Button onClick={confirm} disabled={chosen.size === 0} className="bg-brand-600 hover:bg-brand-700">
                Send {chosen.size} invitation{chosen.size === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {phase === "pick" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Upload a spreadsheet, CSV or contact export. We read the columns, match {agents ? "offices" : "service categories"} and prepare invitations. Nothing is sent until you confirm.
          </p>
          <input
            ref={fileRef}
            id="ai-import-file"
            type="file"
            accept=".csv,.xlsx,.xls,.vcf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) read(f.name);
            }}
          />
          <label
            htmlFor="ai-import-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-6 py-9 text-center hover:bg-brand-50"
          >
            <Upload className="h-6 w-6 text-brand-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-navy-950">Choose a file to import</span>
            <span className="text-xs text-slate-500">CSV, Excel or vCard</span>
          </label>
          <button
            type="button"
            onClick={() => read(agents ? "agent-roster.csv" : "vendor-contacts.csv")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Try with a sample {agents ? "agent roster" : "vendor contact list"}
          </button>
        </div>
      )}
      {phase === "reading" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-brand-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-navy-950">Reading {fileName}…</p>
          <p className="text-xs text-slate-500">Matching names, emails and {agents ? "offices" : "categories"}.</p>
        </div>
      )}
      {phase === "review" && (
        <div>
          <p className="mb-3 text-sm text-slate-600">
            Found <span className="font-semibold text-navy-950">{rows.length}</span> contacts in {fileName}. Untick any you do not want to invite.
          </p>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {rows.map((r) => {
              const on = chosen.has(r.email);
              return (
                <li key={r.email}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50">
                    <input type="checkbox" checked={on} onChange={() => toggle(r.email)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-navy-950">{r.name}</span>
                      <span className="block truncate text-xs text-slate-500">{r.email}</span>
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", on ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                      {on && <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                      {r.detail}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Modal>
  );
}
