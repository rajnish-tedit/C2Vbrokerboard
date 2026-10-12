import type { Metadata } from "next";

import { AdminAuditLogsView } from "@/components/admin/views/AdminAuditLogsView";

export const metadata: Metadata = { title: "Audit Logs · Admin" };

export default function Page() {
  return <AdminAuditLogsView />;
}
