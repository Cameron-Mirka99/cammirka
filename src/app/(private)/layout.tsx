import { RequireAuth } from "@/lib/auth/RequireAuth";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
