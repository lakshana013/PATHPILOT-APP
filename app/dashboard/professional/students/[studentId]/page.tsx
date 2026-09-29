import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function StudentProfileViewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "professional") redirect("/login");

  const { studentId } = await params;
  if (!studentId) redirect("/dashboard/professional/sessions");

  const sessionWithStudent = await prisma.session.findFirst({
    where: {
      professionalId: session.user.id,
      studentId,
      status: { in: ["requested", "accepted", "active"] },
    },
    orderBy: { createdAt: "desc" },
    include: { student: { include: { studentProfile: true } } },
  });

  if (!sessionWithStudent) redirect("/dashboard/professional/sessions");

  const profile = sessionWithStudent.student.studentProfile;
  const studentName = profile?.name ?? sessionWithStudent.student.email;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Student profile</h1>
        <Link
          href="/dashboard/professional/sessions"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Back to chats
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{studentName}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sessionWithStudent.student.email}</p>

        {profile ? (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Age</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.age}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Field of study</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.fieldOfStudy}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Interests</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">
                {profile.interests.length ? profile.interests.join(", ") : "-"}
              </dd>
            </div>
            {profile.goals && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-slate-500 dark:text-slate-400">Goals</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">{profile.goals}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-6 text-slate-600 dark:text-slate-400">This student has not completed a profile yet.</p>
        )}

        <div className="mt-6">
          <Link
            href={`/chat/${sessionWithStudent.id}`}
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Open chat
          </Link>
        </div>
      </div>
    </div>
  );
}
