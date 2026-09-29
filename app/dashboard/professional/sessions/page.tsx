import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ProfessionalSessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "professional") redirect("/login");

  const sessions = await prisma.session.findMany({
    where: {
      professionalId: session.user.id,
      status: { in: ["requested", "accepted", "active"] },
    },
    include: { student: { include: { studentProfile: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">My chats</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          One-on-one sessions with students. Review profile details before opening the chat.
        </p>
      </div>
      {sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">No session requests yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {s.student.studentProfile?.name ?? s.student.email}
                    </span>
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                      {s.status} · {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/professional/students/${s.studentId}`}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    View student profile
                  </Link>
                  <Link
                    href={`/chat/${s.id}`}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Open chat
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
