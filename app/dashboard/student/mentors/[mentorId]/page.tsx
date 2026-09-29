import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") redirect("/login");

  const { mentorId } = await params;
  if (!mentorId) redirect("/dashboard/student/mentors");

  const mentor = await prisma.professionalProfile.findUnique({
    where: { userId: mentorId },
    include: { user: true },
  });
  if (!mentor) redirect("/dashboard/student/mentors");

  const activeSession = await prisma.session.findFirst({
    where: {
      studentId: session.user.id,
      professionalId: mentorId,
      status: { in: ["requested", "accepted", "active"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Mentor profile</h1>
        <Link
          href="/dashboard/student/mentors"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Back to mentors
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{mentor.name}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {mentor.expertise.join(", ") || "No expertise listed"} - {mentor.experienceYears} years experience
        </p>
        <p className="mt-4 text-slate-700 dark:text-slate-300">{mentor.bio}</p>

        {mentor.experienceDescription && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Experience details</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{mentor.experienceDescription}</p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          {activeSession ? (
            <Link
              href={`/chat/${activeSession.id}`}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Open chat
            </Link>
          ) : (
            <Link
              href="/dashboard/student/mentors"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Request from mentors list
            </Link>
          )}
          <span className="text-sm text-slate-500 dark:text-slate-400">{mentor.user.email}</span>
        </div>
      </div>
    </div>
  );
}
