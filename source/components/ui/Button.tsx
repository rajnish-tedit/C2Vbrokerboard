import Link from "next/link";

import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-navy-900 text-white font-semibold hover:bg-navy-800 shadow-sm",
  secondary:
    "border border-slate-300 bg-white text-navy-900 font-semibold hover:bg-slate-50 hover:border-slate-400",
  ghost: "text-navy-700 font-medium hover:bg-slate-100 hover:text-navy-950",
  gold: "bg-gold text-navy-950 font-semibold hover:bg-gold-600 hover:text-white shadow-sm",
  danger: "bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-sm",
} as const;

const SIZES = {
  sm: "rounded-lg px-3 py-1.5 text-xs",
  md: "rounded-lg px-4 py-2 text-sm",
  lg: "rounded-xl px-6 py-3 text-base",
} as const;

type ButtonOwnProps = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  children?: React.ReactNode;
};

type AnchorProps = ButtonOwnProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "className" | "children" | "href"
  >;

type NativeButtonProps = ButtonOwnProps & { href?: undefined } & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

export type ButtonProps = AnchorProps | NativeButtonProps;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (typeof props.href === "string") {
    const { href, ...anchorProps } = props as Omit<
      AnchorProps,
      keyof ButtonOwnProps
    > & {
      href: string;
    };
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes} {...anchorProps}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const buttonProps = props as Omit<NativeButtonProps, keyof ButtonOwnProps>;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
