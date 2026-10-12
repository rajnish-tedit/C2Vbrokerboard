import type { Metadata } from "next";

import { PayoutStatementView } from "@/components/broker/views/PayoutStatementView";

export const metadata: Metadata = { title: "Payout statement" };

export default function PayoutStatementPage({
  params,
}: {
  params: { id: string };
}) {
  return <PayoutStatementView batchId={decodeURIComponent(params.id)} />;
}
