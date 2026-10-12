import type { Metadata } from "next";

import { AdminPayoutsView } from "@/components/admin/views/AdminPayoutsView";

export const metadata: Metadata = { title: "Payout Batches · Admin" };

export default function Page() {
  return <AdminPayoutsView />;
}
