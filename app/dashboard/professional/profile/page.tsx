"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  experienceYears: number;
  experienceDescription: string | null;
};

export default function ProfessionalProfileEditPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    expertise: "",
    experienceYears: "",
    experienceDescription: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/professionals/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProfile(data);
        setForm({
          name: data.name,
          bio: data.bio,
          expertise: data.expertise?.join(", ") ?? "",
          experienceYears: String(data.experienceYears ?? 0),
          experienceDescription: data.experienceDescription ?? "",
        });
      })
      .catch(() => setError("Failed to load profile"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const expertise = form.expertise.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/professionals/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        bio: form.bio,
        expertise,
        experienceYears: parseInt(form.experienceYears, 10) || 0,
        experienceDescription: form.experienceDescription || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error?.message ?? "Update failed");
      return;
    }
    router.push("/dashboard/professional");
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
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
          <textarea
            rows={4}
            required
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Expertise (comma-separated)</label>
          <input
            type="text"
            value={form.expertise}
            onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Years of experience</label>
          <input
            type="number"
            required
            min={0}
            value={form.experienceYears}
            onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Experience description</label>
          <textarea
            rows={3}
            value={form.experienceDescription}
            onChange={(e) => setForm((f) => ({ ...f, experienceDescription: e.target.value }))}
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
            href="/dashboard/professional"
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
