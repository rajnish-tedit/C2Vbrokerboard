"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import {
  INITIAL_DEMO_STATE,
  type DemoActivity,
  type DemoRole,
  type DemoState,
  type Registration,
} from "@/lib/domain/demo";
import { applyDemoState } from "@/lib/domain/selectors";
import type {
  Agent,
  AuditEvent,
  BrokerDataset,
  StripeSetupStatus,
} from "@/lib/domain/types";
import { BROKER_DATASETS, DEMO_BROKER_ID, SEED_AUDIT_EVENTS } from "@/lib/mock";

const STORAGE_KEY = "c2v-broker-demo-v1";

type Action =
  | { type: "hydrate"; state: DemoState }
  | { type: "signIn"; role: DemoRole; email: string }
  | { type: "signOut" }
  | { type: "setStripeStatus"; status: StripeSetupStatus }
  | { type: "setBankPayoutFailed"; failed: boolean }
  | { type: "setPreviewNewBroker"; enabled: boolean }
  | { type: "markRead"; ids: string[] }
  | { type: "markUnread"; id: string }
  | { type: "audit"; event: AuditEvent }
  | { type: "togglePause"; brokerId: string }
  | { type: "resendInvite"; brokerId: string }
  | { type: "inviteAgent"; agent: Agent }
  | { type: "logActivity"; entry: DemoActivity }
  | { type: "completeProfile" }
  | { type: "register"; registration: Registration; password: string }
  | { type: "setPassword"; email: string; password: string }
  | { type: "reset" };

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "signIn":
      return { ...state, session: { role: action.role, email: action.email } };
    case "signOut":
      return { ...state, session: null };
    case "setStripeStatus":
      return {
        ...state,
        stripeStatus: action.status,
        bankPayoutFailed:
          action.status === "connected" ? false : state.bankPayoutFailed,
      };
    case "setBankPayoutFailed":
      return {
        ...state,
        bankPayoutFailed: action.failed,
        stripeStatus: action.failed ? "action_required" : "connected",
      };
    case "setPreviewNewBroker":
      return { ...state, previewNewBroker: action.enabled };
    case "markRead":
      return {
        ...state,
        readNotificationIds: Array.from(
          new Set([...state.readNotificationIds, ...action.ids]),
        ),
      };
    case "markUnread":
      return {
        ...state,
        readNotificationIds: state.readNotificationIds.filter(
          (id) => id !== action.id,
        ),
      };
    case "audit":
      return { ...state, auditEvents: [action.event, ...state.auditEvents] };
    case "togglePause": {
      const paused = state.pausedBrokerIds.includes(action.brokerId);
      return {
        ...state,
        pausedBrokerIds: paused
          ? state.pausedBrokerIds.filter((id) => id !== action.brokerId)
          : [...state.pausedBrokerIds, action.brokerId],
      };
    }
    case "resendInvite":
      return {
        ...state,
        resentInviteBrokerIds: Array.from(
          new Set([...state.resentInviteBrokerIds, action.brokerId]),
        ),
      };
    case "inviteAgent":
      return {
        ...state,
        invitedAgents: [action.agent, ...state.invitedAgents],
        activity: [
          {
            id: `act_${action.agent.id}`,
            kind: "agent_invite",
            text: `You invited ${action.agent.name} to join your broker network`,
            at: new Date().toISOString(),
          },
          ...state.activity,
        ],
      };
    case "logActivity":
      return { ...state, activity: [action.entry, ...state.activity] };
    case "register": {
      const email = action.registration.email.toLowerCase();
      return {
        ...INITIAL_DEMO_STATE,
        credentials: { ...state.credentials, [email]: action.password },
        registration: action.registration,
        previewNewBroker: true,
        session: { role: "broker", email },
      };
    }
    case "setPassword":
      return {
        ...state,
        credentials: {
          ...state.credentials,
          [action.email.toLowerCase()]: action.password,
        },
      };
    case "completeProfile":
      return { ...state, profileComplete: true };
    case "reset":
      return { ...INITIAL_DEMO_STATE, session: state.session };
    default:
      return state;
  }
}

type DemoContextValue = {
  state: DemoState;
  hydrated: boolean;
  broker: BrokerDataset;
  brokers: BrokerDataset[];
  auditEvents: AuditEvent[];
  unreadCount: number;
  signIn: (role: DemoRole, email: string) => void;
  signOut: () => void;
  setStripeStatus: (status: StripeSetupStatus) => void;
  setBankPayoutFailed: (failed: boolean) => void;
  setPreviewNewBroker: (enabled: boolean) => void;
  markRead: (ids: string[]) => void;
  markUnread: (id: string) => void;
  recordAudit: (event: Omit<AuditEvent, "id" | "createdAt">) => void;
  togglePause: (brokerId: string) => void;
  resendInvite: (brokerId: string) => void;
  resetDemo: () => void;
  inviteAgent: (agent: Agent) => void;
  logActivity: (entry: Omit<DemoActivity, "id" | "at">) => void;
  completeProfile: () => void;
  register: (registration: Registration, password: string) => void;
  setPassword: (email: string, password: string) => void;
  /** Name shown for the signed-in Broker user. */
  user: { name: string; first: string };
};

const DemoContext = createContext<DemoContextValue | null>(null);

function readStored(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw
      ? { ...INITIAL_DEMO_STATE, ...(JSON.parse(raw) as Partial<DemoState>) }
      : null;
  } catch {
    return null;
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_DEMO_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) dispatch({ type: "hydrate", state: stored });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private mode); the demo still works in memory.
    }
  }, [state, hydrated]);

  const brokers = useMemo(
    () => BROKER_DATASETS.map((d) => applyDemoState(d, state)),
    [state],
  );
  const broker = brokers.find((d) => d.broker.id === DEMO_BROKER_ID)!;

  const recordAudit = useCallback(
    (event: Omit<AuditEvent, "id" | "createdAt">) => {
      dispatch({
        type: "audit",
        event: {
          ...event,
          id: `ae_demo_${Date.now()}`,
          createdAt: `2026-10-28T${new Date().toISOString().slice(11, 19)}Z`,
        },
      });
    },
    [],
  );

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      hydrated,
      broker,
      brokers,
      auditEvents: [...state.auditEvents, ...SEED_AUDIT_EVENTS].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
      unreadCount: broker.notifications.filter(
        (n) => !state.readNotificationIds.includes(n.id),
      ).length,
      signIn: (role, email) => dispatch({ type: "signIn", role, email }),
      signOut: () => dispatch({ type: "signOut" }),
      setStripeStatus: (status) =>
        dispatch({ type: "setStripeStatus", status }),
      setBankPayoutFailed: (failed) =>
        dispatch({ type: "setBankPayoutFailed", failed }),
      setPreviewNewBroker: (enabled) =>
        dispatch({ type: "setPreviewNewBroker", enabled }),
      markRead: (ids) => dispatch({ type: "markRead", ids }),
      markUnread: (id) => dispatch({ type: "markUnread", id }),
      recordAudit,
      togglePause: (brokerId) => dispatch({ type: "togglePause", brokerId }),
      resendInvite: (brokerId) => dispatch({ type: "resendInvite", brokerId }),
      resetDemo: () => dispatch({ type: "reset" }),
      inviteAgent: (agent) => dispatch({ type: "inviteAgent", agent }),
      logActivity: (entry) =>
        dispatch({
          type: "logActivity",
          entry: {
            ...entry,
            id: `act_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
            at: new Date().toISOString(),
          },
        }),
      completeProfile: () => dispatch({ type: "completeProfile" }),
      register: (registration, password) =>
        dispatch({ type: "register", registration, password }),
      setPassword: (email, password) =>
        dispatch({ type: "setPassword", email, password }),
      user:
        state.registration &&
        state.session?.email === state.registration.email.toLowerCase()
          ? {
              name: state.registration.firstName,
              first: state.registration.firstName,
            }
          : { name: "Michael Carter", first: "Michael" },
    }),
    [state, hydrated, broker, brokers, recordAudit],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

export function useBrokerData(brokerId?: string): BrokerDataset | undefined {
  const { brokers, broker } = useDemo();
  return brokerId ? brokers.find((b) => b.broker.id === brokerId) : broker;
}
