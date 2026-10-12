import type { Metadata } from "next";
import { Suspense } from "react";

import { VendorsView } from "@/components/broker/views/VendorsView";

export const metadata: Metadata = { title: "Referred Vendors" };

export default function VendorsPage() {
  return (
    <Suspense>
      <VendorsView />
    </Suspense>
  );
}
