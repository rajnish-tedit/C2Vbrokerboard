import type { Metadata } from "next";

import { PayoutsView } from "@/components/broker/views/PayoutsView";

export const metadata: Metadata = { title: "Payouts & Statements" };

export default function PayoutsPage() {
  return <PayoutsView />;
}
