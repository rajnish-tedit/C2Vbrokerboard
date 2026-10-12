import type { Metadata } from "next";

import { AdminBrokersView } from "@/components/admin/views/AdminBrokersView";

export const metadata: Metadata = { title: "Brokers · Admin" };

export default function Page() {
  return <AdminBrokersView />;
}
