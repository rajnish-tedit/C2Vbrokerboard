import type { Metadata } from "next";

import { AdminReferralsView } from "@/components/admin/views/AdminReferralsView";

export const metadata: Metadata = { title: "Broker Referrals · Admin" };

export default function Page() {
  return <AdminReferralsView />;
}
