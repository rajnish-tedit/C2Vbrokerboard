import { AppShell } from "@/components/shell/AppShell";

export default function BrokerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell role="broker">{children}</AppShell>;
}
