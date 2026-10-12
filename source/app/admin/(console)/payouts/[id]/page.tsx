import type { Metadata } from "next";

import { AdminPayoutDetailView } from "@/components/admin/views/AdminPayoutDetailView";

export const metadata: Metadata = { title: "Payout batch · Admin" };

export default function Page({ params }: { params: { id: string } }) {
  return <AdminPayoutDetailView batchId={decodeURIComponent(params.id)} />;
}
