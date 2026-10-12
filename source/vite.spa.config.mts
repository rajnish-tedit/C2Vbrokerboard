import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

const r = (p: string) => path.resolve(__dirname, p);
export default defineConfig({
  root: r("spa"),
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/navigation", replacement: r("spa/shims/next-navigation.ts") },
      { find: "next/link", replacement: r("spa/shims/next-link.tsx") },
      { find: "next/font/google", replacement: r("spa/shims/next-font-google.ts") },
      { find: "geist/font/mono", replacement: r("spa/shims/geist-font-mono.ts") },
      { find: /^next$/, replacement: r("spa/shims/next.ts") },
      { find: /^@\//, replacement: r(".") + "/" },
    ],
  },
  define: { "process.env.SITE_URL": "undefined", "process.env.NODE_ENV": JSON.stringify("production") },
  css: { postcss: r(".") },
  build: { outDir: r("dist-spa"), emptyOutDir: true },
  logLevel: "warn",
});
