"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ShapeAuthBackground } from "@/components/ui/shape-auth-background";

export default function SignupStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    fieldOfStudy: "",
    interests: "",
    goals: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const interests = form.interests
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/auth/register/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        name: form.name,
        age: parseInt(form.age, 10),
        fieldOfStudy: form.fieldOfStudy,
        interests,
        goals: form.goals || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      return;
    }
    router.push("/login?registered=student");
    router.refresh();
  }

  const inputClass = "w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <ShapeAuthBackground>
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-xl backdrop-blur-sm">
          <h1 className="mb-6 text-xl font-semibold text-slate-900">
            Student sign up
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password (min 8 characters)</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Age</label>
            <input type="number" required min={13} max={120} value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Field of study</label>
            <input type="text" required placeholder="e.g. Computer Science" value={form.fieldOfStudy} onChange={(e) => setForm((f) => ({ ...f, fieldOfStudy: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Interests (comma-separated)</label>
            <input type="text" placeholder="e.g. AI, web dev, research" value={form.interests} onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Goals or requirements (optional)</label>
            <textarea rows={3} placeholder="What do you want to achieve?" value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} className={inputClass} />
          </div>
          <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Create account
          </button>
        </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account? <Link href="/login" className="font-medium text-indigo-600 underline hover:text-indigo-700">Sign in</Link>
          </p>
        </div>
      </div>
    </ShapeAuthBackground>
  );
}
