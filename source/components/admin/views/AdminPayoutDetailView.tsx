"use client";

import { PayoutStatementView } from "@/components/broker/views/PayoutStatementView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDemo } from "@/lib/store/DemoProvider";

export function AdminPayoutDetailView({ batchId }: { batchId: string }) {
  const { brokers } = useDemo();
  const data = brokers.find((d) =>
    d.payoutBatches.some((b) => b.id === batchId),
  );
  if (!data) {
    return (
      <Card>
        <EmptyState
          title="Payout batch not found"
          action={<Button href="/admin/payouts">All payout batches</Button>}
        />
      </Card>
    );
  }
  return (
    <PayoutStatementView
      batchId={batchId}
      data={data}
      backHref="/admin/payouts"
      backLabel="Payout Batches"
      admin
    />
  );
}
