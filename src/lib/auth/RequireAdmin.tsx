"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.groups.includes("admin") ?? false;

  useEffect(() => {
    if (status === "signedOut") router.replace("/login");
    else if (status === "signedIn" && !isAdmin) router.replace("/my-photos");
  }, [status, isAdmin, router]);

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }
  if (status !== "signedIn" || !isAdmin) return null;

  return <>{children}</>;
}
