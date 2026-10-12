"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { DEMO_TODAY } from "@/lib/domain/policy";
import { BROKER_OFFICES } from "@/lib/domain/network";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

type Props = { open: boolean; onClose: () => void; onSent?: (name: string) => void };

type Errors = Partial<Record<"first" | "last" | "email" | "phone" | "office", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-navy-900">
        {label}
        <span className="text-rose-600"> *</span>
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function InviteAgentDrawer({ open, onClose, onSent }: Props) {
  const demo = useDemo();
  const toast = useToast();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [office, setOffice] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  const selected = BROKER_OFFICES.find((o) => o.name === office);

  const reset = () => {
    setFirst("");
    setLast("");
    setEmail("");
    setPhone("");
    setOffice("");
    setErrors({});
    setSending(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!first.trim()) next.first = "Enter a first name.";
    if (!last.trim()) next.last = "Enter a last name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email, for example name@brokerage.com.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a 10-digit phone number.";
    if (!office) next.office = "Select an office location.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    await new Promise((r) => setTimeout(r, 500));
    const name = `${first.trim()} ${last.trim()}`;
    demo.inviteAgent({
      id: `ag_invited_${Date.now()}`,
      brokerId: demo.broker.broker.id,
      name,
      email: email.trim().toLowerCase(),
      office,
      status: "invited",
      joinedAt: DEMO_TODAY,
      relationshipStatus: "pending",
      linkedAt: DEMO_TODAY,
    });
    toast(`Invitation sent to ${name}`);
    onSent?.(name);
    close();
  };

  const input = (bad?: string) =>
    cn("field h-12", bad && "border-rose-400 focus:border-rose-500 focus:ring-rose-100");

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Invite Agent"
      width="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={close} className="border-brand-600 text-brand-700">
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-agent-form"
            disabled={sending}
            className="min-w-24 bg-brand-600 hover:bg-brand-700"
          >
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      }
    >
      <form id="invite-agent-form" onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="inv-first" label="First name" error={errors.first}>
            <input id="inv-first" className={input(errors.first)} placeholder="e.g. John" value={first} onChange={(e) => { setFirst(e.target.value); setErrors((x) => ({ ...x, first: undefined })); }} autoComplete="off" />
          </Field>
          <Field id="inv-last" label="Last name" error={errors.last}>
            <input id="inv-last" className={input(errors.last)} placeholder="e.g. Doe" value={last} onChange={(e) => { setLast(e.target.value); setErrors((x) => ({ ...x, last: undefined })); }} autoComplete="off" />
          </Field>
        </div>
        <Field id="inv-email" label="Email" error={errors.email}>
          <input id="inv-email" type="email" className={input(errors.email)} placeholder="e.g. example@gmail.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }} autoComplete="off" />
        </Field>
        <Field id="inv-phone" label="Phone number" error={errors.phone}>
          <input id="inv-phone" type="tel" className={input(errors.phone)} placeholder="e.g. +1 464-778-4544" value={phone} onChange={(e) => { setPhone(e.target.value); setErrors((x) => ({ ...x, phone: undefined })); }} autoComplete="off" />
        </Field>
        <Field id="inv-office" label="Office location" error={errors.office}>
          <select id="inv-office" className={input(errors.office)} value={office} onChange={(e) => { setOffice(e.target.value); setErrors((x) => ({ ...x, office: undefined })); }}>
            <option value="">Select an office location</option>
            {BROKER_OFFICES.map((o) => (
              <option key={o.name} value={o.name}>
                {o.branch} — {o.address}
              </option>
            ))}
          </select>
        </Field>
        {selected && (
          <div className="flex gap-3 rounded-lg bg-brand-50 p-4 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-navy-950">{demo.user.name}</p>
              <p className="text-slate-600">
                {selected.branch} · {selected.address}
              </p>
            </div>
          </div>
        )}
      </form>
    </Drawer>
  );
}
