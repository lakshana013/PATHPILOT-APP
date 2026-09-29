"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ShapeAuthBackground } from "@/components/ui/shape-auth-background";

export default function SignupProfessionalPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    bio: "",
    expertise: "",
    experienceYears: "",
    experienceDescription: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const expertise = form.expertise
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/auth/register/professional", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        name: form.name,
        bio: form.bio,
        expertise,
        experienceYears: parseInt(form.experienceYears, 10) || 0,
        experienceDescription: form.experienceDescription || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      return;
    }
    router.push("/login?registered=professional");
    router.refresh();
  }

  const inputClass = "w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <ShapeAuthBackground>
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-xl backdrop-blur-sm">
          <h1 className="mb-6 text-xl font-semibold text-slate-900">
            Mentor sign up
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Professional background / Bio</label>
              <textarea rows={3} required value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Expertise areas (comma-separated)</label>
              <input type="text" placeholder="e.g. Software Engineering, Career coaching" value={form.expertise} onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Years of experience</label>
              <input type="number" required min={0} value={form.experienceYears} onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Experience description (optional)</label>
              <textarea rows={2} value={form.experienceDescription} onChange={(e) => setForm((f) => ({ ...f, experienceDescription: e.target.value }))} className={inputClass} />
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
