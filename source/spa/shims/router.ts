import { useSyncExternalStore } from "react";

// In-memory router: the artifact viewer runs the page in a sandboxed frame
// where history/location changes are blocked, so routes live in JS state.
type Loc = { path: string; search: string };
function parse(href: string): Loc {
  const [path, search = ""] = href.split("?");
  return { path: path || "/", search };
}

const stack: Loc[] = [parse("/broker/login")];
let index = 0;
let snapshot = stack[0];
const listeners = new Set<() => void>();
function emit() {
  snapshot = stack[index];
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function useLocation() {
  return useSyncExternalStore(subscribe, () => snapshot);
}

export function navigate(href: string, opts: { replace?: boolean; scroll?: boolean } = {}) {
  const loc = parse(href.startsWith("/") ? href : "/" + href);
  if (opts.replace) stack[index] = loc;
  else {
    stack.splice(index + 1);
    stack.push(loc);
    index = stack.length - 1;
  }
  emit();
  if (opts.scroll !== false) {
    try { window.scrollTo(0, 0); } catch { /* ignore */ }
  }
}
export function back() {
  if (index > 0) { index--; emit(); }
}
export function forward() {
  if (index < stack.length - 1) { index++; emit(); }
}
