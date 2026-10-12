import type { Metadata } from "next";

import { AgentsView } from "@/components/broker/views/AgentsView";

export const metadata: Metadata = { title: "Agents" };

export default function AgentsPage() {
  return <AgentsView />;
}
