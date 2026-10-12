import type { Metadata } from "next";

import { ReferralsView } from "@/components/broker/views/ReferralsView";

export const metadata: Metadata = { title: "Referral Link & Promo Code" };

export default function ReferralsPage() {
  return <ReferralsView />;
}
