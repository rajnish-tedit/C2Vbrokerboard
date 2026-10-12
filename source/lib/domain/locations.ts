export const COUNTRIES = ["United States", "Canada"] as const;

export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

export const CA_PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia","Ontario",
  "Prince Edward Island","Quebec","Saskatchewan",
];

export function regionsFor(country: string) {
  return country === "Canada" ? CA_PROVINCES : US_STATES;
}

export function isValidPostal(country: string, value: string) {
  const v = value.trim();
  return country === "Canada"
    ? /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v)
    : /^\d{5}(-\d{4})?$/.test(v);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function firstNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const word = local.split(/[._\-+0-9]/).find(Boolean) ?? "Broker";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
