import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

import { ProfileSetupForm } from "./profile-setup-form";

export default async function ProfileSetupPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = (await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      displayName: true,
      bio: true,
      location: true,
    },
  })) as {
    displayName: string;
    bio: string | null;
    location: string | null;
  } | null;

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 items-center px-6 py-12 sm:px-10">
      <section className="mx-auto w-full max-w-3xl rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-amber-700 uppercase">Profile setup</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-stone-900 sm:text-5xl">
          Complete your public profile
        </h1>
        <p className="mt-4 text-stone-700">
          We will generate your unique username from your display name.
        </p>

        <div className="mt-8 rounded-2xl border border-amber-100 bg-white p-6">
          <ProfileSetupForm
            initialDisplayName={user.displayName}
            initialBio={user.bio ?? ""}
            initialLocation={user.location ?? ""}
          />
        </div>
      </section>
    </main>
  );
}
