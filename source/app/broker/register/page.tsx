import type { Metadata } from "next";

import { RegisterWizard } from "@/components/auth/RegisterWizard";

export const metadata: Metadata = { title: "Create your broker account" };

export default function RegisterPage() {
  return <RegisterWizard />;
}
