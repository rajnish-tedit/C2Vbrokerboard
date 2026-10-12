import type { Metadata } from "next";

import { AdminConfigurationView } from "@/components/admin/views/AdminConfigurationView";

export const metadata: Metadata = { title: "Commission Configuration · Admin" };

export default function Page() {
  return <AdminConfigurationView />;
}
