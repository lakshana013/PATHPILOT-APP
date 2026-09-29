"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  onboardingComplete: boolean;
  name: string;
  fieldOfStudy: string;
  interests: string[];
  goals: string | null;
  aiQuestionnaireAnswers: Record<string, unknown> | null;
};

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"fetch" | "questions" | "answer">("fetch");

  useEffect(() => {
    fetch("/api/students/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProfile(data);
        if (data.onboardingComplete) {
          router.push("/dashboard/student");
          return;
        }
        if (data.aiQuestionnaireAnswers && Object.keys(data.aiQuestionnaireAnswers).length > 0) {
          setAnswers(data.aiQuestionnaireAnswers as Record<string, string>);
          setQuestions(Object.keys(data.aiQuestionnaireAnswers));
          setStep("answer");
        } else {
          setStep("questions");
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [router]);

  async function fetchQuestions() {
    setLoadingQuestions(true);
    setError("");
    try {
      const res = await fetch("/api/students/ai-questions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get questions");
      setQuestions(data.questions ?? []);
      setStep("answer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get questions");
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleSubmitAnswers(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/students/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiQuestionnaireAnswers: answers,
          onboardingComplete: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Save failed");
      router.push("/dashboard/student");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        {error ? <p className="text-red-600 dark:text-red-400">{error}</p> : <p>Loading...</p>}
      </div>
    );
  }

  if (step === "questions") {
    return (
      <div className="max-w-lg">
        <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
          Personalized questions
        </h1>
        <p className="mb-6 text-slate-600 dark:text-slate-400">
          We&apos;ll ask a few questions based on your profile to match you with the right mentors.
        </p>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={fetchQuestions}
          disabled={loadingQuestions}
          className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {loadingQuestions ? "Generating questions..." : "Get my questions"}
        </button>
        <Link href="/dashboard/student" className="ml-3 text-sm text-slate-600 dark:text-slate-400 underline">
          Skip for now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-50">
        Answer a few questions
      </h1>
      <form onSubmit={handleSubmitAnswers} className="space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}
        {questions.map((q) => (
          <div key={q}>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {q}
            </label>
            <textarea
              rows={2}
              value={answers[q] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        ))}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {saving ? "Saving..." : "Complete onboarding"}
          </button>
          <Link
            href="/dashboard/student"
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
