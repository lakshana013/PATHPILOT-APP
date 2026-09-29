"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Mentor = {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  experienceYears: number;
  sessionId?: string;
  sessionStatus?: string;
};

export function MentorsList() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/students/mentors")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setMentors(data.mentors ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-600 dark:text-slate-400">Loading mentors...</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (mentors.length === 0)
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        No mentors available yet. Check back later.
      </p>
    );

  return (
    <ul className="space-y-4">
      {mentors.map((m) => (
        <li
          key={m.id}
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50">{m.name}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {m.expertise.join(", ")} · {m.experienceYears} years experience
              </p>
              <p className="mt-2 text-slate-700 dark:text-slate-300">{m.bio}</p>
            </div>
            <div className="shrink-0 space-y-2 text-right">
              <Link
                href={`/dashboard/student/mentors/${m.id}`}
                className="inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                View profile
              </Link>
              {m.sessionId ? (
                <Link
                  href={`/chat/${m.sessionId}`}
                  className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Open chat
                </Link>
              ) : (
                <RequestSessionButton professionalId={m.id} />
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RequestSessionButton({ professionalId }: { professionalId: string }) {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function request() {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setSessionId(data.sessionId);
    } finally {
      setLoading(false);
    }
  }

  if (sessionId)
    return (
      <Link
        href={`/chat/${sessionId}`}
        className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Session requested – Open chat
      </Link>
    );

  return (
    <button
      type="button"
      onClick={request}
      disabled={loading}
      className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {loading ? "Requesting..." : "Request session"}
    </button>
  );
}
