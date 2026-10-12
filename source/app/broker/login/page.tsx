import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/broker/LoginForm";

export const metadata: Metadata = { title: "Broker sign in" };

export default function BrokerLoginPage() {
  return (
    <AuthLayout>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
