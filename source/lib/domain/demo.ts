import type { Agent, AuditEvent, StripeSetupStatus } from "./types";

export type Registration = {
  company: string;
  email: string;
  firstName: string;
  locationLabel: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  state: string;
  country: string;
  /** Cropped logo as a small PNG data URL. */
  logo: string | null;
};

export type DemoActivity = {
  id: string;
  kind: "agent_invite" | "vendor_invite" | "import";
  text: string;
  at: string;
};

export type DemoRole = "broker" | "admin";

export type DemoState = {
  session: { role: DemoRole; email: string } | null;
  stripeStatus: StripeSetupStatus;
  bankPayoutFailed: boolean;
  previewNewBroker: boolean;
  readNotificationIds: string[];
  auditEvents: AuditEvent[];
  pausedBrokerIds: string[];
  resentInviteBrokerIds: string[];
  invitedAgents: Agent[];
  activity: DemoActivity[];
  profileComplete: boolean;
  /** Passwords set by registration or reset, keyed by lower-case email. Demo only. */
  credentials: Record<string, string>;
  registration: Registration | null;
};

export const INITIAL_DEMO_STATE: DemoState = {
  session: null,
  stripeStatus: "connected",
  bankPayoutFailed: false,
  previewNewBroker: false,
  readNotificationIds: [],
  auditEvents: [],
  pausedBrokerIds: [],
  resentInviteBrokerIds: [],
  invitedAgents: [],
  activity: [],
  profileComplete: false,
  credentials: {},
  registration: null,
};
