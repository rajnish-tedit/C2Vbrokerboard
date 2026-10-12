import type { ISODate, MonthKey } from "./types";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parts(date: ISODate): [number, number, number] {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return [y, m, d];
}

export function toISODate(y: number, m: number, d: number): ISODate {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  const [y, m, d] = parts(date);
  return toISODate(y, m, d + days);
}

export function addMonths(date: ISODate, months: number): ISODate {
  const [y, m, d] = parts(date);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return toISODate(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    Math.min(d, lastDay),
  );
}

export function monthKey(date: ISODate): MonthKey {
  return date.slice(0, 7);
}

export function monthStart(month: MonthKey): ISODate {
  return `${month}-01`;
}

export function monthEnd(month: MonthKey): ISODate {
  return addDays(addMonths(monthStart(month), 1), -1);
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  return monthKey(addMonths(monthStart(month), delta));
}

export function monthRange(from: MonthKey, to: MonthKey): MonthKey[] {
  const out: MonthKey[] = [];
  let cursor = from;
  while (cursor <= to) {
    out.push(cursor);
    cursor = shiftMonth(cursor, 1);
  }
  return out;
}

export function formatDate(date: ISODate | null | undefined): string {
  if (!date) return "—";
  const [y, m, d] = parts(date);
  return `${MONTHS_SHORT[m - 1]} ${String(d).padStart(2, "0")}, ${y}`;
}

export function formatShortDate(date: ISODate): string {
  const [, m, d] = parts(date);
  return `${MONTHS_SHORT[m - 1]} ${String(d).padStart(2, "0")}`;
}

export function formatDateTime(value: string): string {
  const date = formatDate(value.slice(0, 10));
  const time = value.length > 10 ? value.slice(11, 16) : "";
  return time ? `${date}, ${time} UTC` : date;
}

export function formatMonth(
  month: MonthKey,
  style: "long" | "short" = "long",
): string {
  const [y, m] = month.split("-").map(Number);
  return `${(style === "long" ? MONTHS_LONG : MONTHS_SHORT)[m - 1]} ${y}`;
}

export function formatMonthShort(month: MonthKey): string {
  const [, m] = month.split("-").map(Number);
  return MONTHS_SHORT[m - 1];
}

export function dayOfMonth(date: ISODate): number {
  return parts(date)[2];
}

export function daysBetween(from: ISODate, to: ISODate): number {
  const [y1, m1, d1] = parts(from);
  const [y2, m2, d2] = parts(to);
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000,
  );
}
