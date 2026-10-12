/// <reference types="vite/client" />
import { Component, createElement, useEffect, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { Providers } from "@/app/providers";
import NotFound from "@/app/not-found";
import "@/app/globals.css";
import { RedirectSignal } from "./shims/next-navigation";
import { navigate, useLocation } from "./shims/router";

type Mod = { default: ComponentType<any> };
const pages = import.meta.glob<Mod>("../app/**/page.tsx", { eager: true });
const layouts = import.meta.glob<Mod>("../app/**/layout.tsx", { eager: true });

// Convert "../app/broker/(portal)/vendors/[id]/page.tsx" into a matcher.
function segs(file: string) {
  return file.replace(/^\.\.\/app/, "").replace(/\/(page|layout)\.tsx$/, "").split("/").filter(Boolean);
}
type Route = { re: RegExp; keys: string[]; page: ComponentType<any>; layouts: ComponentType<any>[]; score: number };
const routes: Route[] = Object.entries(pages).map(([file, mod]) => {
  const s = segs(file);
  const keys: string[] = [];
  const urlParts = s.filter((x) => !/^\(.*\)$/.test(x)).map((x) => {
    const m = x.match(/^\[(.+)\]$/);
    if (m) { keys.push(m[1]); return "([^/]+)"; }
    return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  // Nested layouts (excluding the root HTML layout) from outermost to innermost.
  const ls: ComponentType<any>[] = [];
  for (let i = 1; i <= s.length; i++) {
    const key = "../app/" + s.slice(0, i).join("/") + "/layout.tsx";
    if (layouts[key]) ls.push(layouts[key].default);
  }
  return { re: new RegExp("^/" + urlParts.join("/") + "/?$"), keys, page: mod.default, layouts: ls, score: keys.length };
}).sort((a, b) => a.score - b.score);

// App Router pages are plain (hook-free) server-style functions, so call them
// directly and turn redirect() into a client-side navigation.
function PageHost({ page, params }: { page: ComponentType<any>; params: Record<string, string> }) {
  let out: ReactNode = null;
  let target: string | null = null;
  try {
    out = (page as (p: unknown) => ReactNode)({ params, searchParams: {} });
  } catch (e) {
    if (e instanceof RedirectSignal) target = e.href;
    else throw e;
  }
  useEffect(() => { if (target) navigate(target, { replace: true }); }, [target]);
  return target ? null : <>{out}</>;
}

function App() {
  const { path } = useLocation();
  let el: ReactNode = <NotFound />;
  for (const r of routes) {
    const m = path.match(r.re);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = m[i + 1]));
    el = <PageHost page={r.page} params={params} />;
    for (let i = r.layouts.length - 1; i >= 0; i--) el = createElement(r.layouts[i], null, el);
    break;
  }
  return el;
}

class Crash extends Component<{ children: ReactNode }, { err?: Error }> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <p style={{ fontWeight: 600 }}>Something went wrong on this screen.</p>
        <p style={{ color: "#64748b" }}>{this.state.err.message}</p>
        <button style={{ marginTop: 12, padding: "8px 14px", border: "1px solid #cbd5e1", borderRadius: 8 }}
          onClick={() => { this.setState({ err: undefined }); navigate("/broker/login", { replace: true }); }}>Back to sign in</button>
      </div>
    );
  }
}

// The viewer's sandbox may block native form submission, which would stop the
// submit event React listens for. Re-dispatch it as a plain event instead.
function fireSubmit(form: HTMLFormElement) {
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}
document.addEventListener("click", (e) => {
  const btn = (e.target as Element | null)?.closest?.("button, input[type=submit]") as HTMLButtonElement | null;
  if (!btn || btn.disabled) return;
  const form = btn.form;
  if (!form || (btn.getAttribute("type") ?? "submit") !== "submit") return;
  e.preventDefault();
  fireSubmit(form);
}, true);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const el = e.target as HTMLInputElement | null;
  if (!el || el.tagName !== "INPUT" || !el.form || ["checkbox", "radio", "button", "submit"].includes(el.type)) return;
  e.preventDefault();
  fireSubmit(el.form);
}, true);

document.documentElement.classList.add("font-var-dm-sans", "font-var-geist-mono");
createRoot(document.getElementById("root")!).render(<Crash><Providers><App /></Providers></Crash>);
