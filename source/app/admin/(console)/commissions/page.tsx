import type { Metadata } from "next";

import { AdminCommissionsView } from "@/components/admin/views/AdminCommissionsView";

export const metadata: Metadata = { title: "Commission Transactions · Admin" };

export default function Page() {
  return <AdminCommissionsView />;
}
