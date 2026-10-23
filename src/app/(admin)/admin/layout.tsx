"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const sections = [
  { href: "/admin", label: "Folders" },
  { href: "/admin/upload", label: "Upload" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/tags", label: "Home Tags" },
  { href: "/admin/maintenance", label: "Maintenance" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-5 pb-24 pt-28 sm:px-8">
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
                  active ? "bg-surface text-foreground" : "text-muted hover:bg-surface"
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
  );
}
