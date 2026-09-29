import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ChatRoom } from "./ChatRoom";
import { ReportButton } from "./ReportButton";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  if (!id || typeof id !== "string") {
    redirect(session.user.role === "student" ? "/dashboard/student/chats" : "/dashboard/professional/sessions");
  }

  const s = await prisma.session.findUnique({
    where: { id },
    include: {
      student: { include: { studentProfile: true } },
      professional: { include: { professionalProfile: true } },
    },
  });
  if (!s) {
    redirect(session.user.role === "student" ? "/dashboard/student/chats" : "/dashboard/professional/sessions");
  }
  const isParticipant = s.studentId === session.user.id || s.professionalId === session.user.id;
  if (!isParticipant) {
    redirect(session.user.role === "student" ? "/dashboard/student/chats" : "/dashboard/professional/sessions");
  }

  const otherName =
    session.user.role === "student"
      ? s.professional.professionalProfile?.name ?? s.professional.email
      : s.student.studentProfile?.name ?? s.student.email;
  const otherUserId =
    session.user.role === "student" ? s.professionalId : s.studentId;
  const otherProfileHref =
    session.user.role === "student"
      ? `/dashboard/student/mentors/${s.professionalId}`
      : `/dashboard/professional/students/${s.studentId}`;

  const chatsHref = session.user.role === "student" ? "/dashboard/student/chats" : "/dashboard/professional/sessions";

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <Link href={chatsHref} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:underline">
          ← My chats
        </Link>
        <h1 className="font-semibold text-slate-900 dark:text-slate-50">
          Chat with {otherName}
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href={otherProfileHref}
            className="text-sm font-medium text-slate-700 hover:underline dark:text-slate-300"
          >
            View profile
          </Link>
          <span className="text-xs text-slate-500 dark:text-slate-400">{s.status}</span>
          <ReportButton reportedUserId={otherUserId} />
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <ChatRoom sessionId={id} userRole={session.user.role} userId={session.user.id} sessionStatus={s.status} />
      </div>
    </div>
  );
}
