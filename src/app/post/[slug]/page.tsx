import { notFound } from "next/navigation";

import { db } from "@/lib/db";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params;

  const posts = (await db.experiencePost.findMany({
    where: { slug },
    orderBy: { createdAt: "desc" },
    take: 1,
  })) as Array<{
    id: string;
    title: string;
    body: string;
    locationCity: string;
    locationCountry: string;
    propertyName: string | null;
    tripType: string;
    authorId: string;
  }>;

  const post = posts[0];
  if (!post) {
    notFound();
  }

  const images = (await db.postImage.findMany({
    where: { postId: post.id },
    orderBy: { order: "asc" },
    select: { cloudinaryUrl: true },
  })) as Array<{ cloudinaryUrl: string }>;

  const postTags = (await db.postTag.findMany({
    where: { postId: post.id },
    select: { tagId: true },
  })) as Array<{ tagId: string }>;

  const tagIds = postTags.map((entry) => entry.tagId);
  const tags =
    tagIds.length > 0
      ? ((await db.tag.findMany({
          where: { id: { in: tagIds } },
          select: { name: true },
        })) as Array<{ name: string }>)
      : [];

  return (
    <main className="flex flex-1 px-6 py-12 sm:px-10">
      <section className="mx-auto w-full max-w-4xl rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-amber-700 uppercase">Experience</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-stone-900 sm:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm text-stone-600">
          {post.locationCity}, {post.locationCountry} · {post.tripType}
        </p>
        {post.propertyName && <p className="mt-1 text-sm text-stone-600">Property: {post.propertyName}</p>}

        {tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag.name} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                {tag.name}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 whitespace-pre-wrap text-stone-800">{post.body}</p>

        {images.length > 0 && (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {images.map((image) => (
              <li key={image.cloudinaryUrl} className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.cloudinaryUrl} alt={post.title} className="h-56 w-full object-cover" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
