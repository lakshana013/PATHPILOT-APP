import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function StudentChatsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") redirect("/login");

  const sessions = await prisma.session.findMany({
    where: {
      studentId: session.user.id,
      status: { in: ["requested", "accepted", "active"] },
    },
    include: { professional: { include: { professionalProfile: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          My chats
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          One-on-one sessions with your mentors. Click to open the chat.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">
            No chats yet. Find a mentor to start a session.
          </p>
          <Link
            href="/dashboard/student/mentors"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Find mentors
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/chat/${s.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {s.professional.professionalProfile?.name ?? s.professional.email}
                    </span>
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                      {s.status} · {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                    Open chat
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
