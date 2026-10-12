import type { Metadata } from "next";

import { VendorDetailView } from "@/components/broker/views/VendorDetailView";

export const metadata: Metadata = { title: "Vendor detail" };

export default function VendorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <VendorDetailView vendorId={decodeURIComponent(params.id)} />;
}
