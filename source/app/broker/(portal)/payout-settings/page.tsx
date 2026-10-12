import type { Metadata } from "next";

import { PayoutSettingsView } from "@/components/broker/views/PayoutSettingsView";

export const metadata: Metadata = { title: "Payout Settings" };

export default function PayoutSettingsPage() {
  return <PayoutSettingsView />;
}
