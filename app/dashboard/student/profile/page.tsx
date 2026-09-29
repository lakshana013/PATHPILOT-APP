"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  name: string;
  age: number;
  fieldOfStudy: string;
  interests: string[];
  goals: string | null;
};

export default function StudentProfileEditPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", age: "", fieldOfStudy: "", interests: "", goals: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/students/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProfile(data);
        setForm({
          name: data.name,
          age: String(data.age),
          fieldOfStudy: data.fieldOfStudy,
          interests: data.interests?.join(", ") ?? "",
          goals: data.goals ?? "",
        });
      })
      .catch(() => setError("Failed to load profile"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const interests = form.interests.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/students/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        age: parseInt(form.age, 10),
        fieldOfStudy: form.fieldOfStudy,
        interests,
        goals: form.goals || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error?.message ?? "Update failed");
      return;
    }
    router.push("/dashboard/student");
    router.refresh();
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        {error ? <p className="text-red-600 dark:text-red-400">{error}</p> : <p>Loading...</p>}
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-50">Edit profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Age</label>
          <input
            type="number"
            required
            min={13}
            max={120}
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Field of study</label>
          <input
            type="text"
            required
            value={form.fieldOfStudy}
            onChange={(e) => setForm((f) => ({ ...f, fieldOfStudy: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Interests (comma-separated)</label>
          <input
            type="text"
            value={form.interests}
            onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Goals</label>
          <textarea
            rows={3}
            value={form.goals}
            onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {saving ? "Saving..." : "Save"}
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
