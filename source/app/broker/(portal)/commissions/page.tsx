import type { Metadata } from "next";
import { Suspense } from "react";

import { CommissionsView } from "@/components/broker/views/CommissionsView";

export const metadata: Metadata = { title: "Commissions" };

export default function CommissionsPage() {
  return (
    <Suspense>
      <CommissionsView />
    </Suspense>
  );
}
