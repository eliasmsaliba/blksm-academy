"use client";

import { useEffect, useState } from "react";
import { assignmentsApi, ApiError } from "@/lib/api-client";

export function ModuleAssignment({ moduleId }: { moduleId: string }) {
  const [summary, setSummary] = useState<any | null | undefined>(undefined);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const s = await assignmentsApi.getByModule(moduleId).catch(() => null);
    setSummary(s);
    setContent(s?.mySubmission?.content ?? "");
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await assignmentsApi.submit(summary.id, { content });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (summary === undefined) return null;
  if (summary === null) return null;

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const graded = summary.mySubmission?.status === "GRADED";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Practical Assignment</h3>
        {summary.dueDate && (
          <span className="text-xs text-slate-400">Due {new Date(summary.dueDate).toLocaleDateString()}</span>
        )}
      </div>
      <p className="mt-1 text-sm font-medium text-slate-900">{summary.title}</p>
      {summary.description && <p className="mt-1 text-sm text-slate-600">{summary.description}</p>}

      {graded ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            Graded: {summary.mySubmission.grade}/{summary.maxPoints}
          </div>
          {summary.mySubmission.feedback && (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <span className="font-medium">Feedback:</span> {summary.mySubmission.feedback}
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm text-slate-500">{summary.mySubmission.content}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {summary.mySubmission && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Submitted — awaiting grading. You can still update your answer until it&rsquo;s graded.
            </p>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={10}
            placeholder="Write your submission…"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{wordCount} words</span>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : summary.mySubmission ? "Update submission" : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}
