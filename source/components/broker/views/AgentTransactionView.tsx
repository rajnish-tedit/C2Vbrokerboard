"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Hash,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { BackLink, longDate } from "@/components/broker/views/AgentProfileView";
import { Avatar, LogoTile } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  MILESTONES,
  type TeamGroup,
  type TeamMember,
  agentTransactions,
  transactionDocuments,
  transactionTeam,
} from "@/lib/domain/network";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

function Seal({ preferred }: { preferred: boolean }) {
  return (
    <span
      aria-label={preferred ? "Preferred vendor" : "Agent investor"}
      role="img"
      className={cn(
        "flex h-16 w-16 flex-col items-center justify-center rounded-full border-[3px] border-dashed text-center text-[8px] font-extrabold uppercase leading-tight tracking-wide",
        preferred ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-500 bg-rose-50 text-rose-700",
      )}
    >
      {preferred ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Preferred
          <br />
          vendor
        </>
      ) : (
        <>
          Agent
          <br />
          investor
        </>
      )}
    </span>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  const toast = useToast();
  const [picked, setPicked] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 border-t border-slate-100 px-4 py-4 first:border-t-0 md:grid-cols-[auto_minmax(0,1.4fr)_auto_auto_auto]">
      <input type="checkbox" checked={picked} onChange={(e) => setPicked(e.target.checked)} aria-label={`Select ${member.company}`} className="h-5 w-5 rounded border-slate-300 text-brand-600" />
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative">
          <LogoTile name={member.company} className="h-12 w-14" />
          <Avatar name={member.contact} size="sm" className="absolute -bottom-2 -right-2 h-6 w-6 border-2 border-white text-[9px]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-navy-950">{member.company}</span>
          <span className="block truncate text-sm text-slate-600">{member.contact}</span>
        </span>
      </div>
      <span className={cn("hidden w-fit rounded-md px-2.5 py-1 text-xs font-medium md:inline-flex", sent || member.status === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800")}>
        {sent ? "Invited" : member.status === "accepted" ? "Accepted" : "Pending"}
      </span>
      <span className="hidden md:block">
        <Seal preferred={member.preferred} />
      </span>
      <span className="flex items-center gap-2 justify-self-end text-sm text-navy-900">
        <span className="hidden sm:inline">Invite</span>
        <button
          type="button"
          onClick={() => {
            setSent(true);
            toast(`Invitation sent to ${member.company}`);
          }}
          aria-label={`Invite ${member.company}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-white hover:bg-brand-700"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </span>
    </li>
  );
}

function Group({ group }: { group: TeamGroup }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 bg-brand-50 px-4 py-3">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-center gap-3 text-[15px] font-medium text-brand-800">
          {open ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
          {group.category} ({group.members.length})
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-white" aria-hidden="true">
          <Users className="h-4 w-4" />
        </span>
      </div>
      {open &&
        (group.members.length ? (
          <ul>{group.members.map((m, i) => <MemberRow key={`${m.company}-${i}`} member={m} />)}</ul>
        ) : (
          <p className="px-4 py-12 text-center text-[15px] font-semibold text-navy-950">No Vendors Available</p>
        ))}
    </section>
  );
}

function docIcon(kind: string) {
  return kind === "CSV" || kind === "DOC" || kind === "DOCX" ? <FileText className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
}

export function AgentTransactionView({ agentId, transactionId }: { agentId: string; transactionId: string }) {
  const { broker: data } = useDemo();
  const toast = useToast();
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [team, setTeam] = useState<"buyer" | "seller" | "client">("buyer");
  const [files, setFiles] = useState<"docs" | "media">("docs");

  const agent = data.agents.find((a) => a.id === agentId);
  const txn = useMemo(() => (agent ? agentTransactions(agent).find((t) => t.id === transactionId) : undefined), [agent, transactionId]);

  if (!agent || !txn) {
    return (
      <div className="space-y-6">
        <BackLink href={agent ? `/broker/agents/${agent.id}` : "/broker/agents"} />
        <EmptyState title="Transaction not found" body="This transaction is not available for this Agent." />
      </div>
    );
  }

  const groups = transactionTeam(data, txn, team === "seller" ? "seller" : "buyer");
  const docs = transactionDocuments(txn);
  const typeLabel = txn.type === "buyer" ? "Buyer Transaction" : "Seller Transaction";
  const noDownload = () => toast("Downloads are not available in the prototype");

  return (
    <div className="space-y-6">
      <BackLink href={`/broker/agents/${agent.id}`} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="num flex items-center gap-1 text-sm text-slate-600">
          <Hash className="h-4 w-4 text-brand-600" aria-hidden="true" />
          {txn.number.replace(/^F/, "")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-navy-950">{txn.client} - {txn.address}</h1>
          <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{typeLabel}</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Created on: <span className="text-navy-950">{new Date(`${txn.createdAt}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
        </p>
        <div className="mt-6 rounded-lg bg-slate-100 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Task description</p>
          <p className="mt-1.5 text-sm text-navy-950">{txn.task}</p>
        </div>
        <div className="mt-6 rounded-lg border border-slate-200">
          <button type="button" onClick={() => setMilestoneOpen((v) => !v)} aria-expanded={milestoneOpen} className="flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] font-medium text-navy-950">
            Milestone
            {milestoneOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
          </button>
          {milestoneOpen && (
            <ol className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-5">
              {MILESTONES.map((m, i) => {
                const done = i <= txn.milestone;
                return (
                  <li key={m} className="flex items-center gap-2 text-sm">
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", done ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500")}>
                      {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                    </span>
                    <span className={done ? "font-medium text-navy-950" : "text-slate-500"}>{m}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div role="tablist" aria-label="Transaction team" className="flex gap-6 border-b border-slate-200">
            {(
              [
                ["buyer", "My Team (Buyer)"],
                ["seller", "Seller Agent Team"],
                ["client", "Client Info"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={team === key}
                onClick={() => setTeam(key)}
                className={cn("-mb-px border-b-2 py-3 text-xs font-semibold uppercase tracking-wide transition-colors", team === key ? "border-navy-900 text-navy-950" : "border-transparent text-slate-500 hover:text-navy-900")}
              >
                {label}
              </button>
            ))}
          </div>
          {team === "client" ? (
            <dl className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2">
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Client</dt><dd className="mt-1 font-semibold text-navy-950">{txn.client}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Transaction type</dt><dd className="mt-1 font-semibold text-navy-950">{typeLabel}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-slate-500">Property</dt><dd className="mt-1 font-semibold text-navy-950">{txn.address}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Agent</dt><dd className="mt-1 font-semibold text-navy-950">{agent.name}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Created</dt><dd className="mt-1 font-semibold text-navy-950">{longDate(txn.createdAt)}</dd></div>
            </dl>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-[15px] text-navy-950">Template: Home {team === "buyer" ? "Selling" : "Listing"}</p>
              {groups.map((g) => <Group key={g.category} group={g} />)}
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-xl font-semibold text-navy-950">Attachments &amp; Documents</h2>
          <div role="tablist" aria-label="Attachment type" className="mt-5 grid grid-cols-2 border-b border-slate-200 text-center text-sm">
            {(
              [
                ["docs", "Docs"],
                ["media", "Media"],
              ] as const
            ).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={files === key} onClick={() => setFiles(key)} className={cn("-mb-px border-b-2 py-3 font-medium", files === key ? "border-navy-900 text-navy-950" : "border-transparent text-slate-500")}>
                {label}
              </button>
            ))}
          </div>
          {files === "media" ? (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
              <ImageIcon className="h-6 w-6" aria-hidden="true" />
              No photos or videos have been added.
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {docs.map((d) => (
                <li key={d.name} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">{docIcon(d.kind)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-950">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.kind} • {d.size}</p>
                    <p className="mt-1 text-xs text-slate-500">by {d.by}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between gap-3 self-stretch">
                    <span className="flex gap-2 text-brand-600">
                      {d.kind === "PDF" && (
                        <button type="button" onClick={noDownload} aria-label={`Preview ${d.name}`} className="hover:text-brand-800"><Maximize2 className="h-4 w-4" /></button>
                      )}
                      <button type="button" onClick={noDownload} aria-label={`Download ${d.name}`} className="hover:text-brand-800"><Download className="h-4 w-4" /></button>
                    </span>
                    <span className="text-[11px] text-slate-400">{new Date(`${d.at}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
