import Link from "next/link";

import { auth, googleAuthConfigured } from "@/auth";

import { UserMenu } from "./user-menu";

const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/create", label: "Share", authRequired: true },
] as const;

export async function SiteHeader() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  const visibleLinks = navLinks.filter(
    (link) => !("authRequired" in link) || (link.authRequired && isAuthenticated),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1760px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex items-center gap-8">
          <Link
            href="/explore"
            className="font-heading text-4xl font-bold tracking-tight text-teal-500 transition hover:text-teal-400"
          >
            RealBnB
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-amber-100/60 hover:text-stone-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <UserMenu
          isAuthenticated={isAuthenticated}
          googleAuthConfigured={googleAuthConfigured}
          displayName={session?.user?.name ?? null}
          navLinks={visibleLinks.map((l) => ({ href: l.href, label: l.label }))}
        />
      </div>
    </header>
  );
}
