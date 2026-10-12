"use client";

import { useState } from "react";

import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { Card } from "@/components/ui/Card";
import { SearchInput, Select } from "@/components/ui/Controls";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDemo } from "@/lib/store/DemoProvider";

export function AdminAuditLogsView() {
  const { auditEvents, brokers } = useDemo();
  const [broker, setBroker] = useState("all");
  const [actor, setActor] = useState("all");
  const [query, setQuery] = useState("");
  const rows = auditEvents.filter(
    (e) =>
      (broker === "all" || e.brokerId === broker) &&
      (actor === "all" ||
        (actor === "system"
          ? e.actor.startsWith("System")
          : !e.actor.startsWith("System"))) &&
      (!query ||
        `${e.summary} ${e.action} ${e.reason ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Every Admin override, policy change, payout action and notable system event, with before/after values and the reason given."
      />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search summary, action or reason"
            className="w-72"
          />
          <Select
            label="Broker"
            value={broker}
            onChange={setBroker}
            options={[
              { value: "all", label: "All Brokers" },
              ...brokers.map((b) => ({
                value: b.broker.id,
                label: b.broker.companyName,
              })),
            ]}
          />
          <Select
            label="Actor"
            value={actor}
            onChange={setActor}
            options={[
              { value: "all", label: "Everyone" },
              { value: "people", label: "C2V staff" },
              { value: "system", label: "System jobs & webhooks" },
            ]}
          />
          <p className="ml-auto text-sm text-slate-500">{rows.length} events</p>
        </div>
        <AuditLogTable events={rows} pageSize={25} />
      </Card>
    </div>
  );
}
