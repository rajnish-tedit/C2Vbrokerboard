"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AUTH_INPUT, AuthButton, AuthLabel, AuthLayout } from "@/components/auth/AuthLayout";
import { LogoField } from "@/components/auth/LogoUploadFlow";
import { PasswordInput, StrengthMeter } from "@/components/auth/PasswordInput";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { COUNTRIES, EMAIL_RE, firstNameFromEmail, isValidPostal, regionsFor } from "@/lib/domain/locations";
import { DEMO_CREDENTIALS } from "@/lib/mock";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

type Errors = Record<string, string | undefined>;

function Err({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-rose-600">
      {msg}
    </p>
  ) : null;
}

const bad = (e?: string) => (e ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "");

function Progress({ step }: { step: 1 | 2 }) {
  const pct = step === 1 ? 30 : 60;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[15px] font-bold uppercase tracking-wide text-navy-950">
          Account setup <span className="ml-1 text-xs font-semibold normal-case tracking-normal text-brand-600">{pct}% complete</span>
        </p>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Step {step} of 2</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Account setup progress">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-600 via-olive to-sun transition-all" style={{ width: `${pct * 1.4}%` }} />
      </div>
    </div>
  );
}

function LegalModal({ kind, onClose }: { kind: "terms" | "privacy" | null; onClose: () => void }) {
  return (
    <Modal open={kind !== null} onClose={onClose} title={kind === "privacy" ? "Privacy Policy" : "Terms of Service"} size="sm">
      <p className="text-sm text-slate-600">
        This is a prototype. The full {kind === "privacy" ? "Privacy Policy" : "Terms of Service"} would open here. No data is sent anywhere.
      </p>
    </Modal>
  );
}

const SAMPLE_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200"><rect width="600" height="200" fill="#fff"/><rect x="40" y="40" width="120" height="120" rx="22" fill="#3E5C9E"/><path d="M70 120 L100 74 L130 120 Z" fill="#FFC93C"/><rect x="82" y="120" width="36" height="14" fill="#fff"/><text x="182" y="98" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="700" fill="#1e2f5a">TOWN SQUARE</text><text x="184" y="140" font-family="Arial,Helvetica,sans-serif" font-size="30" letter-spacing="8" fill="#A8913B">REALTY</text></svg>',
)}`;

export function RegisterWizard() {
  const demo = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  const [busy, setBusy] = useState(false);

  const [company, setCompany] = useState("Town Square Realty");
  const [email, setEmail] = useState("michael@townsquarerealty.com");
  const [password, setPassword] = useState("Town35-Demo!");
  const [confirm, setConfirm] = useState("Town35-Demo!");
  const [agree, setAgree] = useState(true);

  const [logo, setLogo] = useState<string | null>(SAMPLE_LOGO);
  const [label, setLabel] = useState("Main Office");
  const [phone, setPhone] = useState("(512) 555-0142");
  const [address, setAddress] = useState("500 Congress Ave, Suite 100");
  const [city, setCity] = useState("Austin");
  const [zip, setZip] = useState("78701");
  const [country, setCountry] = useState("United States");
  const [region, setRegion] = useState("Texas");
  const [errors, setErrors] = useState<Errors>({});

  const clear = (k: string) => setErrors((e) => ({ ...e, [k]: undefined }));

  const fillDemo = () => {
    if (step === 1) {
      setCompany("Town Square Realty");
      setEmail("michael@townsquarerealty.com");
      setPassword("Town35-Demo!");
      setConfirm("Town35-Demo!");
      setAgree(true);
    } else {
      setLabel("Main Office");
      setPhone("(512) 555-0142");
      setAddress("500 Congress Ave, Suite 100");
      setCity("Austin");
      setZip("78701");
      setCountry("United States");
      setRegion("Texas");
    }
    setErrors({});
  };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errors = {};
    const em = email.trim().toLowerCase();
    if (company.trim().length < 2) er.company = "Enter your broker or company name.";
    if (!EMAIL_RE.test(em)) er.email = "Enter a valid business email, for example name@brokerage.com.";
    else if (em === DEMO_CREDENTIALS.email || em === DEMO_CREDENTIALS.adminEmail)
      er.email = "An account with this email already exists. Sign in instead.";
    if (password.length < 8) er.password = "Use at least 8 characters.";
    if (confirm !== password) er.confirm = "Passwords do not match.";
    if (!agree) er.agree = "Accept the Terms of Service and Privacy Policy to continue.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errors = {};
    if (!label.trim()) er.label = "Give this location a label, for example Main Office.";
    if (phone.replace(/\D/g, "").length < 10) er.phone = "Enter a 10-digit office phone number.";
    if (address.trim().length < 5) er.address = "Enter the office street address.";
    if (!city.trim()) er.city = "Enter a city.";
    if (!isValidPostal(country, zip)) er.zip = country === "Canada" ? "Use the format A1A 1A1." : "Enter a 5-digit ZIP code.";
    if (!region) er.region = country === "Canada" ? "Select a province." : "Select a state.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    demo.register(
      {
        company: company.trim(),
        email: email.trim().toLowerCase(),
        firstName: firstNameFromEmail(email),
        locationLabel: label.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        zip: zip.trim(),
        state: region,
        country,
        logo,
      },
      password,
    );
    toast("Account created. Welcome to Client2Vendor!");
    router.push("/broker/dashboard");
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="mb-8 flex items-center gap-4">
          {step === 2 ? (
            <button type="button" onClick={() => setStep(1)} aria-label="Back to account details" className="rounded-lg p-1.5 text-brand-700 hover:bg-brand-50">
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : (
            <Link href="/broker/login" aria-label="Back to sign in" className="rounded-lg p-1.5 text-brand-700 hover:bg-brand-50">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          )}
        </div>
        <Progress step={step} />

        {step === 1 ? (
          <form onSubmit={next} noValidate className="mt-9 space-y-5">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-navy-950">Create your broker account</h1>
              <p className="mt-2 text-[15px] text-slate-500">Start with the details you will use to securely access and identify your brokerage.</p>
            </div>
            <div>
              <AuthLabel htmlFor="reg-company">Broker or company name</AuthLabel>
              <input id="reg-company" value={company} onChange={(e) => { setCompany(e.target.value); clear("company"); }} autoComplete="organization" placeholder="e.g. Town Square Realty" className={cn(AUTH_INPUT, bad(errors.company))} aria-describedby={errors.company ? "reg-company-error" : undefined} />
              <Err id="reg-company" msg={errors.company} />
            </div>
            <div>
              <AuthLabel htmlFor="reg-email">Business email</AuthLabel>
              <input id="reg-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clear("email"); }} autoComplete="email" placeholder="e.g. name@yourbrokerage.com" className={cn(AUTH_INPUT, bad(errors.email))} />
              <Err id="reg-email" msg={errors.email} />
            </div>
            <div>
              <AuthLabel htmlFor="reg-password">Password</AuthLabel>
              <PasswordInput id="reg-password" value={password} onChange={(e) => { setPassword(e.target.value); clear("password"); }} autoComplete="new-password" placeholder="At least 8 characters.." invalid={!!errors.password} />
              <StrengthMeter value={password} />
              <Err id="reg-password" msg={errors.password} />
            </div>
            <div>
              <AuthLabel htmlFor="reg-confirm">Confirm password</AuthLabel>
              <PasswordInput id="reg-confirm" value={confirm} onChange={(e) => { setConfirm(e.target.value); clear("confirm"); }} autoComplete="new-password" placeholder="At least 8 characters.." invalid={!!errors.confirm} />
              <Err id="reg-confirm" msg={errors.confirm} />
            </div>
            <div>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-navy-900">
                <input id="reg-agree" type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); clear("agree"); }} className="h-5 w-5 rounded border-slate-300 text-brand-600" />
                <span>
                  I agree to the C2V{" "}
                  <button type="button" onClick={() => setLegal("terms")} className="font-semibold text-brand-700 hover:underline">Terms of Service</button>{" "}
                  and{" "}
                  <button type="button" onClick={() => setLegal("privacy")} className="font-semibold text-brand-700 hover:underline">Privacy Policy</button>.
                </span>
              </label>
              <Err id="reg-agree" msg={errors.agree} />
            </div>
            <AuthButton type="submit" className="mt-2">Continue to Logo &amp; Locations</AuthButton>
            <p className="text-center text-sm text-slate-600">
              Already have an account? <Link href="/broker/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
            </p>
            <p className="text-center"><button type="button" onClick={fillDemo} className="text-xs font-semibold text-slate-500 hover:text-brand-700 hover:underline">Fill in demo details</button></p>
          </form>
        ) : (
          <form onSubmit={submit} noValidate className="mt-9 space-y-5">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-navy-950">Add your logo and first office</h1>
              <p className="mt-2 text-[15px] text-slate-500">Agents and vendors see your logo. You can add more offices from your profile later.</p>
            </div>
            <LogoField value={logo} onChange={setLogo} />
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <AuthLabel htmlFor="reg-label">Location label</AuthLabel>
                <input id="reg-label" value={label} onChange={(e) => { setLabel(e.target.value); clear("label"); }} placeholder="e.g. Main Office" className={cn(AUTH_INPUT, bad(errors.label))} />
                <Err id="reg-label" msg={errors.label} />
              </div>
              <div>
                <AuthLabel htmlFor="reg-phone">Office phone number</AuthLabel>
                <input id="reg-phone" type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clear("phone"); }} placeholder="e.g. (333) 333 3333" className={cn(AUTH_INPUT, bad(errors.phone))} />
                <Err id="reg-phone" msg={errors.phone} />
              </div>
            </div>
            <div>
              <AuthLabel htmlFor="reg-address">Address</AuthLabel>
              <input id="reg-address" value={address} onChange={(e) => { setAddress(e.target.value); clear("address"); }} autoComplete="street-address" placeholder="Enter your address" className={cn(AUTH_INPUT, bad(errors.address))} />
              <Err id="reg-address" msg={errors.address} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <AuthLabel htmlFor="reg-city">City</AuthLabel>
                <input id="reg-city" value={city} onChange={(e) => { setCity(e.target.value); clear("city"); }} placeholder="e.g. New Jersey" className={cn(AUTH_INPUT, bad(errors.city))} />
                <Err id="reg-city" msg={errors.city} />
              </div>
              <div>
                <AuthLabel htmlFor="reg-zip">{country === "Canada" ? "Postal code" : "ZIP"}</AuthLabel>
                <input id="reg-zip" value={zip} onChange={(e) => { setZip(e.target.value); clear("zip"); }} placeholder={country === "Canada" ? "e.g. M5V 2T6" : "e.g. 123236"} className={cn(AUTH_INPUT, bad(errors.zip))} />
                <Err id="reg-zip" msg={errors.zip} />
              </div>
              <div>
                <AuthLabel htmlFor="reg-state">{country === "Canada" ? "Province" : "State"}</AuthLabel>
                <select id="reg-state" value={region} onChange={(e) => { setRegion(e.target.value); clear("region"); }} className={cn(AUTH_INPUT, bad(errors.region), !region && "text-slate-400")}>
                  <option value="">Select</option>
                  {regionsFor(country).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <Err id="reg-state" msg={errors.region} />
              </div>
              <div>
                <AuthLabel htmlFor="reg-country">Country</AuthLabel>
                <select id="reg-country" value={country} onChange={(e) => { setCountry(e.target.value); setRegion(""); }} className={AUTH_INPUT}>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <AuthButton type="submit" disabled={busy} className="mt-2 min-w-[14rem]">{busy ? "Creating account…" : "Submit"}</AuthButton>
            <p className="text-center"><button type="button" onClick={fillDemo} className="text-xs font-semibold text-slate-500 hover:text-brand-700 hover:underline">Fill in demo details</button></p>
          </form>
        )}
      </div>
      <LegalModal kind={legal} onClose={() => setLegal(null)} />
    </AuthLayout>
  );
}
