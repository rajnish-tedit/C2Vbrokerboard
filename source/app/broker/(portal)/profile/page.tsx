import type { Metadata } from "next";

import { ProfileView } from "@/components/broker/views/ProfileView";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return <ProfileView />;
}
