import { AuthGate } from "@/components/auth-gate";

export default function HelperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate dashboard="helper">{children}</AuthGate>;
}
