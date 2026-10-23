import { RequireAdmin } from "@/lib/auth/RequireAdmin";

export default function AdminGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
