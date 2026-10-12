import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";

export const metadata: Metadata = { title: "Forgot password" };

export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordView />
    </Suspense>
  );
}
