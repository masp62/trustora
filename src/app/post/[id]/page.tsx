import { notFound, permanentRedirect } from "next/navigation";

import { auth } from "@/auth";
import { getPostDetailById, postCanonicalPath } from "@/app/post/post-detail-data";

type PostByIdPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostByIdRedirectPage({ params }: PostByIdPageProps) {
  const { id } = await params;
  const session = await auth();
  const post = await getPostDetailById(id, session?.user?.id ?? null);

  if (!post) {
    notFound();
  }

  permanentRedirect(postCanonicalPath(post.id, post.slug));
}
