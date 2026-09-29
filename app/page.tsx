import Link from "next/link";
import { BackgroundPathsBackground } from "@/components/ui/background-paths";

export default function Home() {
  return (
    <BackgroundPathsBackground>
      <main className="flex max-w-2xl flex-col items-center gap-8 px-6 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          PathPilot
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Your secure career guidance platform. Get matched with mentors and grow your path.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup/student"
            className="rounded-full bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            I&apos;m a Student
          </Link>
          <Link
            href="/signup/professional"
            className="rounded-full border border-slate-300 px-6 py-3 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            I&apos;m a Mentor
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-200 px-6 py-3 text-slate-600 dark:border-slate-700 dark:text-slate-400"
          >
            Sign in
          </Link>
        </div>
      </main>
    </BackgroundPathsBackground>
  );
}
