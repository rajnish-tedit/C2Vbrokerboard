import { useMemo } from "react";
import { back, forward, navigate, useLocation } from "./router";

export function useRouter() {
  return useMemo(
    () => ({
      push: (href: string, o?: { scroll?: boolean }) => navigate(href, { scroll: o?.scroll }),
      replace: (href: string, o?: { scroll?: boolean }) => navigate(href, { replace: true, scroll: o?.scroll }),
      back,
      forward,
      refresh: () => {},
      prefetch: () => {},
    }),
    [],
  );
}
export function usePathname() {
  return useLocation().path;
}
export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}
export function useParams() {
  return {};
}
export class RedirectSignal {
  constructor(public href: string) {}
}
export function redirect(href: string): never {
  throw new RedirectSignal(href);
}
export function notFound(): never {
  throw new RedirectSignal("/__not_found");
}
