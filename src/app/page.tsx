import { redirect } from "next/navigation";

import { auth, googleAuthConfigured } from "@/auth";
import { getHomeFeedPage } from "@/lib/home-feed";

import { HomeFeedClient } from "./home-feed-client";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/explore");
  }

  const { posts, hasMore, nextCursor, followsAny } = await getHomeFeedPage(session.user.id);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto mb-8 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Home feed</p>
        <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-gray-900 sm:text-6xl xl:max-w-none">
          Latest stories from travelers you follow.
        </h1>
      </section>

      <section className="mx-auto w-full max-w-[1760px]">
        <HomeFeedClient
          initialPosts={posts}
          initialHasMore={hasMore}
          initialNextCursor={nextCursor}
          followsAny={followsAny}
          isAuthenticated
          googleAuthConfigured={googleAuthConfigured}
        />
      </section>
    </main>
  );
}
