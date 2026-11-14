"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPhotos } from "@/lib/api/photos";
import { Skeleton } from "@/components/ui/Skeleton";

const sections = [
  { href: "/admin/archive", label: "Archive" },
  { href: "/admin", label: "Folders" },
  { href: "/admin/upload", label: "Upload" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/tags", label: "Home Tags" },
  { href: "/admin/maintenance", label: "Maintenance" },
];

function useBackgroundPhoto() {
  return useQuery({
    queryKey: ["admin-background"],
    queryFn: async () => (await fetchPublicPhotos({ limit: 1 })).photos[0] ?? null,
    staleTime: 10 * 60_000,
  });
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: background } = useBackgroundPhoto();
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  return (
    <div className="relative min-h-screen">
      {background && !backgroundLoaded && <Skeleton className="fixed inset-0" />}
      {background && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={background.url}
          alt=""
          onLoad={() => setBackgroundLoaded(true)}
          className={`fixed inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            backgroundLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      <div className="fixed inset-0 bg-black/50" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8">
        <div className="flex gap-10 rounded-xl border border-border bg-surface p-6 shadow-xl sm:p-8">
          <aside className="hidden w-44 shrink-0 sm:block">
            <nav className="sticky top-28 space-y-1">
              {sections.map((s) => {
                const active =
                  s.href === "/admin"
                    ? pathname === "/admin" || pathname.startsWith("/admin/folders")
                    : pathname.startsWith(s.href);
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className={clsx(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      active ? "bg-background text-foreground" : "text-muted hover:bg-background"
                    )}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
