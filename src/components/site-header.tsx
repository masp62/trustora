import Link from "next/link";

import { auth, googleAuthConfigured } from "@/auth";

import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 sm:px-10">
        <Link
          href="/explore"
          className="font-heading text-4xl font-bold tracking-tight text-teal-500 transition hover:text-teal-400"
        >
          RealBnB
        </Link>
        <UserMenu
          isAuthenticated={isAuthenticated}
          googleAuthConfigured={googleAuthConfigured}
          displayName={session?.user?.name ?? null}
        />
      </div>
    </header>
  );
}
