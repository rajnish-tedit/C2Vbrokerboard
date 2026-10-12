import { cn, initials } from "@/lib/utils";

const TINTS = [
  "from-rose-500 to-rose-800",
  "from-brand-500 to-brand-800",
  "from-emerald-500 to-emerald-800",
  "from-amber-500 to-amber-700",
  "from-violet-500 to-violet-800",
  "from-sky-500 to-sky-800",
  "from-slate-500 to-slate-800",
];

function tint(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "round" | "square";
  className?: string;
};

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-24 w-24 text-3xl rounded-2xl shadow-lg",
} as const;

export function Avatar({ name, size = "md", shape = "round", className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-gradient-to-br font-bold text-white",
        tint(name),
        SIZES[size],
        size !== "xl" && (shape === "round" ? "rounded-full" : "rounded-lg"),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Company logo placeholder: rounded tile with the company's initials. */
export function LogoTile({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[11px] font-extrabold tracking-tight text-brand-700",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
