import { addDays } from "@/lib/domain/dates";
import type { Agent, AgentStatus, ISODate } from "@/lib/domain/types";

import { createNameFactory, emailFor } from "./names";
import type { Rng } from "./prng";

type AgentMix = { active: number; inactive: number; invited: number };

export function generateAgents(
  rng: Rng,
  brokerId: string,
  domain: string,
  offices: string[],
  mix: AgentMix,
  from: ISODate,
  spanDays: number,
): Agent[] {
  const names = createNameFactory(rng);
  const statuses: AgentStatus[] = [
    ...Array<AgentStatus>(mix.active).fill("active"),
    ...Array<AgentStatus>(mix.inactive).fill("inactive"),
    ...Array<AgentStatus>(mix.invited).fill("invited"),
  ];
  const agents = statuses.map((status, index) => {
    const name = names.person();
    const joinedAt = addDays(from, rng.int(0, spanDays));
    return {
      id: `ag_${brokerId}_${String(index + 1).padStart(3, "0")}`,
      brokerId,
      name,
      email: emailFor(name, domain),
      office: rng.pick(offices),
      status,
      joinedAt,
      relationshipStatus:
        status === "invited" ? ("pending" as const) : ("linked" as const),
      linkedAt: joinedAt,
    };
  });
  return agents.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
}
