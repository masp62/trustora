import Link from "next/link";

import { auth, googleAuthConfigured } from "@/auth";

import { SearchNavForm } from "./search-nav-form";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/create", label: "Share", authRequired: true },
  { href: "/admin", label: "Admin", authRequired: true, adminOnly: true },
] as const;

export async function SiteHeader() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  const visibleLinks = navLinks.filter(
    (link) =>
      (!("authRequired" in link) || (link.authRequired && isAuthenticated)) &&
      (!("adminOnly" in link) || (link.adminOnly && session?.user?.role === "admin")),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1760px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex min-w-0 items-center gap-3 sm:gap-8">
          <Link
            href="/explore"
            className="touch-target font-heading text-3xl font-bold tracking-tight text-brand transition hover:text-brand-hover sm:text-4xl"
          >
            Trustora
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <SearchNavForm />
          <ThemeToggle />
          <UserMenu
            isAuthenticated={isAuthenticated}
            googleAuthConfigured={googleAuthConfigured}
            displayName={session?.user?.name ?? null}
            navLinks={visibleLinks.map((l) => ({ href: l.href, label: l.label }))}
          />
        </div>
      </div>
    </header>
  );
}

