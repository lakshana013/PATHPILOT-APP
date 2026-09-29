import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/app/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isStudent = session.user.role === "student";
  const base = isStudent ? "/dashboard/student" : "/dashboard/professional";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href={base} className="font-semibold text-slate-900 dark:text-slate-50">
            PathPilot
          </Link>
          <nav className="flex items-center gap-4">
            <Link href={base} className="text-sm text-slate-600 dark:text-slate-400 hover:underline">
              Dashboard
            </Link>
            <Link href={isStudent ? `${base}/chats` : `${base}/sessions`} className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:underline">
              Chat
            </Link>
            {isStudent && (
              <Link href={`${base}/mentors`} className="text-sm text-slate-600 dark:text-slate-400 hover:underline">
                Find mentors
              </Link>
            )}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
