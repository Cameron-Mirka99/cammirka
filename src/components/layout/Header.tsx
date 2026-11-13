"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useThemeMode } from "@/lib/theme/ThemeProvider";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-current" strokeWidth={1.75}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M4.75 19.25c0-3.45 3.26-6 7.25-6s7.25 2.55 7.25 6" strokeLinecap="round" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, signOut } = useAuth();
  const { mode, toggle } = useThemeMode();
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = user?.groups.includes("admin") ?? false;
  const overlay = pathname === "/" && !scrolled;

  useEffect(() => {
    if (pathname !== "/") return;
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navLinks: { href: string; label: string }[] = [
    { href: "/", label: "Home" },
    { href: "/archive", label: "Archive" },
    { href: "/about", label: "About" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        overlay
          ? "bg-transparent text-white"
          : "border-b border-border bg-background/80 text-foreground backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="font-serif text-lg tracking-wide">
          Cameron Mirka
          <span className="ml-2 hidden text-xs font-sans uppercase tracking-[0.2em] opacity-70 sm:inline">
            Wildlife Photography
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="opacity-80 transition-opacity hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href={status === "signedIn" ? "/my-photos" : "/login?redirect=%2Fmy-photos"}
            className="opacity-80 transition-opacity hover:opacity-100"
          >
            My Photos
          </Link>

          <button
            onClick={toggle}
            aria-label="Toggle color mode"
            className="rounded-full border border-current/30 px-3 py-1 text-xs opacity-80 transition-opacity hover:opacity-100"
          >
            {mode === "dark" ? "Light" : "Dark"}
          </button>

          {status === "signedIn" ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  aria-label="Account menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-current/30 opacity-80 transition-opacity hover:opacity-100"
                >
                  <UserIcon />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={12}
                  className="z-[60] min-w-40 rounded-lg border border-border bg-surface p-2 text-sm text-foreground shadow-lg"
                >
                  <DropdownMenu.Item asChild>
                    <Link href="/account" className="block rounded px-3 py-2 outline-none hover:bg-background">
                      Account
                    </Link>
                  </DropdownMenu.Item>
                  {isAdmin && (
                    <DropdownMenu.Item asChild>
                      <Link href="/admin" className="block rounded px-3 py-2 outline-none hover:bg-background">
                        Admin
                      </Link>
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item
                    onSelect={handleSignOut}
                    className="block rounded px-3 py-2 outline-none hover:bg-background"
                  >
                    Sign out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="opacity-80 transition-opacity hover:opacity-100"
            >
              Log In
            </Link>
          )}
        </nav>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center md:hidden"
            >
              <span className="relative block h-3 w-5">
                <span className="absolute inset-x-0 top-0 h-px bg-current" />
                <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                <span className="absolute inset-x-0 bottom-0 h-px bg-current" />
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={12}
              className="z-[60] min-w-48 rounded-lg border border-border bg-surface p-2 text-sm text-foreground shadow-lg"
            >
              {navLinks.map((link) => (
                <DropdownMenu.Item key={link.href} asChild>
                  <Link href={link.href} className="block rounded px-3 py-2 outline-none hover:bg-background">
                    {link.label}
                  </Link>
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Item asChild>
                <Link
                  href={status === "signedIn" ? "/my-photos" : "/login?redirect=%2Fmy-photos"}
                  className="block rounded px-3 py-2 outline-none hover:bg-background"
                >
                  My Photos
                </Link>
              </DropdownMenu.Item>
              {status === "signedIn" ? (
                <>
                  <DropdownMenu.Item asChild>
                    <Link href="/account" className="block rounded px-3 py-2 outline-none hover:bg-background">
                      Account
                    </Link>
                  </DropdownMenu.Item>
                  {isAdmin && (
                    <DropdownMenu.Item asChild>
                      <Link href="/admin" className="block rounded px-3 py-2 outline-none hover:bg-background">
                        Admin
                      </Link>
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item
                    onSelect={handleSignOut}
                    className="block rounded px-3 py-2 outline-none hover:bg-background"
                  >
                    Sign out
                  </DropdownMenu.Item>
                </>
              ) : (
                <DropdownMenu.Item asChild>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(pathname)}`}
                    className="block rounded px-3 py-2 outline-none hover:bg-background"
                  >
                    Log In
                  </Link>
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item
                onSelect={toggle}
                className="block rounded px-3 py-2 outline-none hover:bg-background"
              >
                {mode === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
