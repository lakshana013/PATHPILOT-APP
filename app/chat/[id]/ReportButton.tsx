"use client";

import { useState } from "react";

export function ReportButton({ reportedUserId }: { reportedUserId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId,
          reason: reason.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        setDone(true);
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) return <span className="text-xs text-slate-500 dark:text-slate-400">Report submitted</span>;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
      >
        Report
      </button>
      {open && (
        <form
          onSubmit={submit}
          className="absolute right-0 top-full z-10 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Select...</option>
            <option value="false_info">False or misleading information</option>
            <option value="misuse">Platform misuse</option>
            <option value="inappropriate">Inappropriate behavior</option>
            <option value="rules_violation">Rules violation</option>
            <option value="other">Other</option>
          </select>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Description (optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit report"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
