import type { Metadata } from "next";

import { AgentTransactionView } from "@/components/broker/views/AgentTransactionView";

export const metadata: Metadata = { title: "Transaction" };

export default function Page({ params }: { params: { id: string; tid: string } }) {
  return (
    <AgentTransactionView
      agentId={decodeURIComponent(params.id)}
      transactionId={decodeURIComponent(params.tid)}
    />
  );
}
