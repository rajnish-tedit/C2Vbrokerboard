"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { DemoProvider } from "@/lib/store/DemoProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <ToastProvider>{children}</ToastProvider>
    </DemoProvider>
  );
}
