import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { navigate } from "./router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string; query?: Record<string, string> };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

function toHref(href: Props["href"]) {
  if (typeof href === "string") return href;
  const q = href.query ? "?" + new URLSearchParams(href.query).toString() : "";
  return (href.pathname || "/") + q;
}

const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { href, prefetch: _p, replace, scroll, onClick, ...rest },
  ref,
) {
  const h = toHref(href);
  const external = /^(https?:|mailto:|tel:)/.test(h);
  return (
    <a
      ref={ref}
      href={external ? h : h}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (external || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || rest.target) return;
        e.preventDefault();
        navigate(h, { replace, scroll });
      }}
      {...rest}
    />
  );
});
export default Link;
