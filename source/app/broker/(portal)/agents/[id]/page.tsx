import type { Metadata } from "next";

import { AgentProfileView } from "@/components/broker/views/AgentProfileView";

export const metadata: Metadata = { title: "Agent profile" };

export default function Page({ params }: { params: { id: string } }) {
  return <AgentProfileView agentId={decodeURIComponent(params.id)} />;
}
