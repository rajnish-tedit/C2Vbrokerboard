import type { BrokerDataset } from "@/lib/domain/types";

import { centuryRealty, metroHomes, northstarBrokerage } from "./otherBrokers";
import { townSquare } from "./townSquare";

export { ATTRIBUTION_CASES, SEED_AUDIT_EVENTS } from "./adminSeed";
export type { AttributionCase } from "./adminSeed";

export const DEMO_BROKER_ID = "town-square";

export const DEMO_CREDENTIALS = {
  email: "michael.carter@townsquarerealty.com",
  password: "Town35-Demo!",
  notActivatedEmail: "jordan.lee@townsquarerealty.com",
  adminEmail: "sarah.kim@client2vendor.com",
};

export const BROKER_DATASETS: BrokerDataset[] = [
  townSquare,
  centuryRealty,
  northstarBrokerage,
  metroHomes,
];

export function getSeedDataset(brokerId: string): BrokerDataset | undefined {
  return BROKER_DATASETS.find((d) => d.broker.id === brokerId);
}
