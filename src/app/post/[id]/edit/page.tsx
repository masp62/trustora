import { forbidden, notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

import { EditPostForm } from "./edit-form";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

async function getPostForEdit(postId: string) {
  const post = (await db.experiencePost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      status: true,
      title: true,
      body: true,
      locationCity: true,
      locationCountry: true,
      propertyName: true,
      tripType: true,
      authorId: true,
    },
  })) as {
    id: string;
    status: "draft" | "published";
    title: string;
    body: string;
    locationCity: string;
    locationCountry: string;
    propertyName: string | null;
    tripType: string;
    authorId: string;
  } | null;

  if (!post) return null;

  const [images, postTags] = await Promise.all([
    db.postImage.findMany({
      where: { postId: post.id },
      orderBy: { order: "asc" },
      select: { cloudinaryUrl: true, order: true },
    }) as Promise<Array<{ cloudinaryUrl: string; order: number }>>,
    db.postTag.findMany({
      where: { postId: post.id },
      select: { tagId: true },
    }) as Promise<Array<{ tagId: string }>>,
  ]);

  const rating = (await db.accommodationRating.findMany({
    where: { postId: post.id, userId: post.authorId },
    take: 1,
    select: {
      overallScore: true,
      cleanliness: true,
      accuracy: true,
      checkIn: true,
      communication: true,
      location: true,
      value: true,
      comfort: true,
      facilities: true,
    },
  })) as Array<{
    overallScore: number;
    cleanliness: number;
    accuracy: number;
    checkIn: number;
    communication: number;
    location: number;
    value: number;
    comfort: number;
    facilities: number;
  }>;

  const tagIds = postTags.map((entry) => entry.tagId);
  const tags =
    tagIds.length > 0
      ? ((await db.tag.findMany({
          where: { id: { in: tagIds } },
          select: { name: true },
        })) as Array<{ name: string }>)
      : [];

  return {
    id: post.id,
    status: post.status,
    title: post.title,
    body: post.body,
    locationCity: post.locationCity,
    locationCountry: post.locationCountry,
    propertyName: post.propertyName ?? "",
    tripType: post.tripType,
    authorId: post.authorId,
    categoryRatings:
      rating.length > 0
        ? {
            cleanliness: rating[0].cleanliness,
            accuracy: rating[0].accuracy,
            checkIn: rating[0].checkIn,
            communication: rating[0].communication,
            location: rating[0].location,
            value: rating[0].value,
            comfort: rating[0].comfort,
            facilities: rating[0].facilities,
          }
        : {
            cleanliness: 0,
            accuracy: 0,
            checkIn: 0,
            communication: 0,
            location: 0,
            value: 0,
            comfort: 0,
            facilities: 0,
          },
    images: images.map((img) => img.cloudinaryUrl),
    tags: tags.map((tag) => tag.name),
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const post = await getPostForEdit(id);

  if (!post) {
    notFound();
  }

  if (post.authorId !== session.user.id) {
    forbidden();
  }

  return (
    <main className="flex flex-1 px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Edit experience</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-gray-900 sm:text-5xl">
          Update your story
        </h1>
        <p className="mt-2 inline-flex w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold tracking-wide text-gray-700 uppercase">
          Status: {post.status}
        </p>
        <p className="mt-4 text-gray-700">
          Edit your photos, destination details, trip type, and tags.
        </p>

        <EditPostForm post={post} />
      </section>
    </main>
  );
}
