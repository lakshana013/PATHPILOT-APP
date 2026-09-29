import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ProfessionalDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "professional") redirect("/login");

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/signup/professional");

  const sessions = await prisma.session.findMany({
    where: {
      professionalId: session.user.id,
      status: { in: ["requested", "accepted", "active"] },
    },
    include: { student: { include: { studentProfile: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Welcome, {profile.name}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {profile.expertise.join(", ")} · {profile.experienceYears} years experience
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-50">Your profile</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Name</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Expertise</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.expertise.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Experience</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.experienceYears} years</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Bio</dt>
              <dd className="mt-1 text-slate-900 dark:text-slate-50">{profile.bio}</dd>
            </div>
          </dl>
          <Link
            href="/dashboard/professional/profile"
            className="mt-4 inline-block text-sm font-medium text-slate-700 underline dark:text-slate-300"
          >
            Edit profile
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-50">Sessions</h2>
          <Link
            href="/dashboard/professional/sessions"
            className="text-sm font-medium text-slate-700 underline dark:text-slate-300"
          >
            View all
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No session requests yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/chat/${s.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {s.student.studentProfile?.name ?? s.student.email}
                  </span>
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                    {s.status} · {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
