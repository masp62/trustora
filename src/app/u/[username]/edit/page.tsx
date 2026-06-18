import { forbidden, notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

import { EditProfileForm } from "./edit-profile-form";

type EditProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { username } = await params;

  const user = (await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      location: true,
      avatarUrl: true,
    },
  })) as {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    location: string | null;
    avatarUrl: string | null;
  } | null;

  if (!user) {
    notFound();
  }

  if (user.id !== session.user.id) {
    forbidden();
  }

  return (
    <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-2xl rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">
          Edit profile
        </p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-gray-900 sm:text-5xl">
          Update your profile
        </h1>
        <p className="mt-4 text-gray-700">
          Change your display name, username, bio, location, or avatar.
        </p>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
          <EditProfileForm
            initialDisplayName={user.displayName}
            initialBio={user.bio ?? ""}
            initialLocation={user.location ?? ""}
            initialUsername={user.username}
            initialAvatarUrl={user.avatarUrl}
          />
        </div>
      </section>
    </main>
  );
}
