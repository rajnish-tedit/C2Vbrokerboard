import type { Cents } from "./types";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function dollars(amount: number): Cents {
  return Math.round(amount * 100);
}

export function formatMoney(
  cents: Cents,
  options: { signed?: boolean } = {},
): string {
  const formatted = USD.format(Math.abs(cents) / 100);
  if (cents < 0) return `−${formatted}`;
  if (options.signed && cents > 0) return `+${formatted}`;
  return formatted;
}

export function formatRate(bps: number): string {
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2)}%`;
}

// Round half away from zero so a refund reverses exactly what the original row earned.
export function commissionFor(amountCents: Cents, rateBps: number): Cents {
  const raw = (Math.abs(amountCents) * rateBps) / 10_000;
  const rounded = Math.round(raw + Number.EPSILON);
  return amountCents < 0 ? -rounded : rounded;
}

export function sum(values: Cents[]): Cents {
  return values.reduce((total, value) => total + value, 0);
}
