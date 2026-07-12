import { AuthGate } from "@/components/auth-gate";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate dashboard="client">{children}</AuthGate>;
}
