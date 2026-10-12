import type { Metadata } from "next";

import { AdminBrokerDetailView } from "@/components/admin/views/AdminBrokerDetailView";

export const metadata: Metadata = { title: "Broker detail · Admin" };

export default function Page({ params }: { params: { id: string } }) {
  return <AdminBrokerDetailView brokerId={decodeURIComponent(params.id)} />;
}
