import { notFound, permanentRedirect } from "next/navigation";

import { getPostDetailById, postCanonicalPath } from "@/app/post/post-detail-data";

type PostByIdPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostByIdRedirectPage({ params }: PostByIdPageProps) {
  const { id } = await params;
  const post = await getPostDetailById(id);

  if (!post) {
    notFound();
  }

  permanentRedirect(postCanonicalPath(post.id, post.slug));
}
