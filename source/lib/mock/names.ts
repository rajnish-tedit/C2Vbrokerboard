import type { Rng } from "./prng";

const COMPANY_PREFIXES = [
  "Allied",
  "Apex",
  "Bayview",
  "Blue Ridge",
  "Brightline",
  "Cedar",
  "Clearwater",
  "Copper Creek",
  "Crestview",
  "Diamond",
  "Eagle",
  "Evergreen",
  "Fairway",
  "First Choice",
  "Foxhall",
  "Golden State",
  "Granite",
  "Harbor",
  "Heritage",
  "Highland",
  "Ironwood",
  "Keystone",
  "Lakeshore",
  "Liberty",
  "Lone Star",
  "Maple",
  "Meridian",
  "Mission",
  "North Point",
  "Oakridge",
  "Pacific",
  "Parkside",
  "Peak",
  "Pinnacle",
  "Prairie",
  "Precision",
  "Premier",
  "Quality",
  "Redwood",
  "Reliable",
  "Ridgeline",
  "Riverstone",
  "Rockwell",
  "Sagebrush",
  "Silver Oak",
  "Summit",
  "Sunbelt",
  "Sunrise",
  "Titan",
  "Trinity",
  "True North",
  "Union",
  "Valley",
  "Vista",
  "Westfield",
  "Willow",
  "Windsor",
];

export const TRADES = [
  "Plumbing",
  "Roofing",
  "Electric",
  "HVAC",
  "Landscaping",
  "Pest Control",
  "Painting",
  "Cleaning",
  "Home Inspection",
  "Handyman Services",
  "Flooring",
  "Pool Services",
  "Windows & Doors",
  "Moving Co.",
  "Garage Doors",
  "Pressure Washing",
  "Appliance Repair",
  "Fencing",
  "Gutter Care",
  "Remodeling",
];

const COMPANY_SUFFIXES = [
  "",
  "",
  " LLC",
  " Co.",
  " Pros",
  " Group",
  " Services",
];

const FIRST_NAMES = [
  "Aaron",
  "Aisha",
  "Alicia",
  "Andre",
  "Angela",
  "Ben",
  "Brandon",
  "Carla",
  "Carlos",
  "Chloe",
  "Daniel",
  "Danielle",
  "Derek",
  "Diana",
  "Elena",
  "Eric",
  "Fatima",
  "Gavin",
  "Grace",
  "Hannah",
  "Hector",
  "Isaac",
  "Jasmine",
  "Jason",
  "Jenna",
  "Jordan",
  "Julia",
  "Kevin",
  "Kim",
  "Laura",
  "Leah",
  "Luis",
  "Marcus",
  "Maria",
  "Megan",
  "Monica",
  "Nathan",
  "Nina",
  "Olivia",
  "Omar",
  "Priya",
  "Rachel",
  "Ramon",
  "Rebecca",
  "Ryan",
  "Samantha",
  "Sean",
  "Sofia",
  "Tanya",
  "Tyler",
  "Vanessa",
  "Victor",
  "Wesley",
  "Yvonne",
  "Zach",
];

const LAST_NAMES = [
  "Adams",
  "Alvarez",
  "Baker",
  "Bennett",
  "Brooks",
  "Campbell",
  "Chen",
  "Collins",
  "Cruz",
  "Davis",
  "Diaz",
  "Edwards",
  "Evans",
  "Fisher",
  "Flores",
  "Foster",
  "Garcia",
  "Gomez",
  "Gray",
  "Hall",
  "Harris",
  "Hughes",
  "Jackson",
  "James",
  "Jenkins",
  "Johnson",
  "Kelly",
  "Kim",
  "Lee",
  "Lewis",
  "Lopez",
  "Martin",
  "Mitchell",
  "Moore",
  "Morgan",
  "Nguyen",
  "Ortiz",
  "Parker",
  "Patel",
  "Perez",
  "Phillips",
  "Price",
  "Reed",
  "Reyes",
  "Rivera",
  "Roberts",
  "Robinson",
  "Ross",
  "Sanders",
  "Scott",
  "Shah",
  "Stewart",
  "Sullivan",
  "Taylor",
  "Thomas",
  "Torres",
  "Turner",
  "Walker",
  "Ward",
  "Watson",
  "White",
  "Wood",
  "Wright",
  "Young",
];

export const CITIES: { city: string; state: string; taxRateBps: number }[] = [
  { city: "Austin", state: "TX", taxRateBps: 625 },
  { city: "Round Rock", state: "TX", taxRateBps: 625 },
  { city: "San Marcos", state: "TX", taxRateBps: 625 },
  { city: "Georgetown", state: "TX", taxRateBps: 625 },
  { city: "Pflugerville", state: "TX", taxRateBps: 625 },
  { city: "Phoenix", state: "AZ", taxRateBps: 560 },
  { city: "Denver", state: "CO", taxRateBps: 0 },
  { city: "Nashville", state: "TN", taxRateBps: 700 },
];

export function createNameFactory(rng: Rng, reserved: string[] = []) {
  const usedCompanies = new Set(reserved.map((n) => n.toLowerCase()));
  const usedPeople = new Set<string>();

  return {
    company(trade?: string) {
      for (let attempt = 0; attempt < 500; attempt++) {
        const t = trade ?? rng.pick(TRADES);
        const name = `${rng.pick(COMPANY_PREFIXES)} ${t}${rng.pick(COMPANY_SUFFIXES)}`;
        if (!usedCompanies.has(name.toLowerCase())) {
          usedCompanies.add(name.toLowerCase());
          return { name, trade: t };
        }
      }
      throw new Error("Company name space exhausted");
    },
    person() {
      for (let attempt = 0; attempt < 5000; attempt++) {
        const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
        if (!usedPeople.has(name)) {
          usedPeople.add(name);
          return name;
        }
      }
      throw new Error("Person name space exhausted");
    },
  };
}

export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function emailFor(person: string, domain: string): string {
  const [first, last] = person.toLowerCase().split(" ");
  return `${first}.${last}@${domain}`;
}
