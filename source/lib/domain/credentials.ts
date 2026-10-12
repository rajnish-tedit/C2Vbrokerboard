import { DEMO_CREDENTIALS } from "@/lib/mock";

import type { DemoState } from "./demo";

/** Email addresses that can sign in or reset a password in the prototype. */
export function knownAccount(state: DemoState, email: string): "broker" | "admin" | "registered" | null {
  const e = email.trim().toLowerCase();
  if (e === DEMO_CREDENTIALS.email) return "broker";
  if (e === DEMO_CREDENTIALS.adminEmail) return "admin";
  if (e in state.credentials) return "registered";
  return null;
}

export function expectedPassword(state: DemoState, email: string): string | null {
  const e = email.trim().toLowerCase();
  if (e in state.credentials) return state.credentials[e];
  if (e === DEMO_CREDENTIALS.email || e === DEMO_CREDENTIALS.adminEmail) return DEMO_CREDENTIALS.password;
  return null;
}
