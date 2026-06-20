import { forbidden, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { AdminDashboardClient } from "@/app/admin/admin-dashboard-client";
import { getAdminOverviewData, getPendingAdminQueue } from "@/lib/admin-dashboard";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.admin) {
    forbidden();
  }

  const [pendingReports, overview] = await Promise.all([getPendingAdminQueue(), getAdminOverviewData()]);

  return (
    <main className="flex flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 sm:py-12">
      <section className="mx-auto w-full max-w-[1760px] space-y-6 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <div>
          <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Admin moderation</p>
          <h1 className="mt-3 font-heading text-3xl leading-tight text-gray-900 sm:text-5xl">Admin dashboard</h1>
          <p className="mt-3 text-gray-700">
            Review platform usage insights and moderate reported posts and comments.
          </p>
        </div>

        <AdminDashboardClient
          initialOverview={overview}
          initialReports={pendingReports.map((report) => ({
            ...report,
            createdAt: report.createdAt.toISOString(),
          }))}
        />
      </section>
    </main>
  );
}