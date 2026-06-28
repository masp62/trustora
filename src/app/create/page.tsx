import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CreatePostForm } from "@/app/create/create-form";

export default async function CreatePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Create experience</p>
        <h1 className="mt-4 font-heading text-3xl leading-tight text-gray-900 sm:text-5xl">
          Share your stay story
        </h1>
        <p className="mt-4 text-gray-700">
          Add photos, destination details, trip type, and tags. Publish immediately or save as a private draft to finish later.
        </p>

        <CreatePostForm />
      </section>
    </main>
  );
}
