"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { assignmentsApi, ApiError } from "@/lib/api-client";

export default function GradeSubmissionPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const router = useRouter();
  const [submission, setSubmission] = useState<any | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  async function refresh() {
    const s = await assignmentsApi.getGradingDetail(submissionId);
    setSubmission(s);
    setGrade(s.grade != null ? String(s.grade) : "");
    setFeedback(s.feedback ?? "");
  }

  useEffect(() => {
    refresh();
  }, [submissionId]);

  async function handleGrade(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await assignmentsApi.gradeSubmission(submissionId, { grade: Number(grade), feedback: feedback || undefined });
      router.push("/admin/grading");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save grade");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPostingComment(true);
    try {
      await assignmentsApi.addComment(submissionId, { body: comment });
      setComment("");
      await refresh();
    } finally {
      setPostingComment(false);
    }
  }

  if (!submission) return <p className="text-sm text-slate-500">Loading…</p>;

  const wordCount = submission.content ? submission.content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/grading" className="text-sm text-indigo-600 hover:underline">
          &larr; Back to grading queue
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{submission.assignment.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {submission.user.firstName} {submission.user.lastName} ({submission.user.email}) &middot; submitted{" "}
          {new Date(submission.submittedAt).toLocaleString()} &middot; {wordCount} words
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="whitespace-pre-wrap text-sm text-slate-700">{submission.content}</p>
      </div>

      <form onSubmit={handleGrade} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          {submission.status === "GRADED" ? "Update grade" : "Grade this submission"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Grade (out of {submission.assignment.maxPoints})</span>
            <input
              type="number"
              min={0}
              max={submission.assignment.maxPoints}
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="input mt-1"
            />
          </label>
        </div>
        <label className="mt-4 block text-sm">
          <span className="font-medium text-slate-700">Feedback</span>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="input mt-1"
            rows={4}
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save grade"}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Comments</h2>
        <div className="space-y-3">
          {submission.comments?.map((c: any) => (
            <div key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-700">
                {c.author.firstName} {c.author.lastName}
              </p>
              <p className="mt-1 text-slate-600">{c.body}</p>
            </div>
          ))}
          {(!submission.comments || submission.comments.length === 0) && (
            <p className="text-sm text-slate-400">No comments yet.</p>
          )}
        </div>
        <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input flex-1"
            placeholder="Add a comment"
          />
          <button
            type="submit"
            disabled={postingComment}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
