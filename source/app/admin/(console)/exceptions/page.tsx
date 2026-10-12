import type { Metadata } from "next";

import { AdminExceptionsView } from "@/components/admin/views/AdminExceptionsView";

export const metadata: Metadata = { title: "Payout Exceptions · Admin" };

export default function Page() {
  return <AdminExceptionsView />;
}
