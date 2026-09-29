import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") redirect("/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/signup/student");

  const sessions = await prisma.session.findMany({
    where: {
      studentId: session.user.id,
      status: { in: ["requested", "accepted", "active"] },
    },
    include: { professional: { include: { professionalProfile: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Welcome, {profile.name}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {profile.fieldOfStudy} · {profile.interests.length ? profile.interests.join(", ") : "No interests yet"}
        </p>
      </div>

      {!profile.onboardingComplete && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Complete your profile with a few personalized questions so we can match you better.
          </p>
          <Link
            href="/dashboard/student/onboarding"
            className="mt-2 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Continue onboarding
          </Link>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-50">Your profile</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Name</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Age</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.age}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Field of study</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.fieldOfStudy}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Interests</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">
                {profile.interests.length ? profile.interests.join(", ") : "—"}
              </dd>
            </div>
            {profile.goals && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-slate-500 dark:text-slate-400">Goals</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.goals}</dd>
              </div>
            )}
          </dl>
          <Link
            href="/dashboard/student/profile"
            className="mt-4 inline-block text-sm font-medium text-slate-700 underline dark:text-slate-300"
          >
            Edit profile
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-50">Recent sessions</h2>
          <Link
            href="/dashboard/student/mentors"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Find mentors
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No sessions yet. Find a mentor to get started.
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
                    {s.professional.professionalProfile?.name ?? s.professional.email}
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
