import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MentorsList } from "./MentorsList";

export default async function StudentMentorsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Find mentors</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Get matched with professionals who can guide your career.
        </p>
      </div>
      <MentorsList />
    </div>
  );
}
