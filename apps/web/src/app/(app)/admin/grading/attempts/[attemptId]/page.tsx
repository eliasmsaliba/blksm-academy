"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { assessmentsApi, ApiError } from "@/lib/api-client";

const MANUAL_TYPES = ["SHORT_ANSWER", "ESSAY"];

export default function GradeAttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<any | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { pointsAwarded: string; feedback: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  async function refresh() {
    const a = await assessmentsApi.getGradingDetail(attemptId);
    setAttempt(a);
    setDrafts((prev) => {
      const next = { ...prev };
      for (const ans of a.answers) {
        if (!next[ans.id]) {
          next[ans.id] = {
            pointsAwarded: ans.pointsAwarded != null ? String(ans.pointsAwarded) : "",
            feedback: ans.feedback ?? "",
          };
        }
      }
      return next;
    });
  }

  useEffect(() => {
    refresh();
  }, [attemptId]);

  function pointsFor(questionId: string, fallback: number) {
    const entry = (attempt?.questionSnapshot ?? []).find((s: any) => s.questionId === questionId);
    return entry?.points ?? fallback;
  }

  async function handleGrade(answerId: string) {
    setSavingAnswerId(answerId);
    setError(null);
    try {
      const draft = drafts[answerId];
      await assessmentsApi.gradeAnswer(attemptId, answerId, {
        pointsAwarded: Number(draft.pointsAwarded),
        feedback: draft.feedback || undefined,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save grade");
    } finally {
      setSavingAnswerId(null);
    }
  }

  async function handleFinalize() {
    setFinalizing(true);
    setError(null);
    try {
      await assessmentsApi.finalizeAttempt(attemptId);
      router.push("/admin/grading");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to finalize grading");
    } finally {
      setFinalizing(false);
    }
  }

  if (!attempt) return <p className="text-sm text-slate-500">Loading…</p>;

  const manualAnswers = attempt.answers.filter((a: any) => MANUAL_TYPES.includes(a.question.questionType));
  const allGraded = manualAnswers.every((a: any) => a.pointsAwarded != null);
  const alreadyFinalized = attempt.gradingStatus === "MANUALLY_GRADED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/grading" className="text-sm text-indigo-600 hover:underline">
          &larr; Back to grading queue
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{attempt.assessment.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {attempt.user.firstName} {attempt.user.lastName} ({attempt.user.email}) &middot; submitted{" "}
          {new Date(attempt.submittedAt).toLocaleString()}
        </p>
        {alreadyFinalized && (
          <p className="mt-2 text-sm font-medium text-emerald-700">
            Finalized — score {Math.round(attempt.score)}% ({attempt.passed ? "Passed" : "Not passed"})
          </p>
        )}
      </div>

      <div className="space-y-4">
        {attempt.answers.map((ans: any) => {
          const manual = MANUAL_TYPES.includes(ans.question.questionType);
          const maxPoints = pointsFor(ans.questionId, ans.question.points);
          return (
            <div key={ans.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-900">{ans.question.promptText?.text}</p>

              {!manual ? (
                <p
                  className={`mt-2 text-sm font-medium ${ans.isCorrect ? "text-emerald-700" : "text-red-600"}`}
                >
                  {ans.isCorrect ? "✓ Correct" : "✗ Incorrect"} (auto-graded, {ans.pointsAwarded}/{maxPoints} pts)
                </p>
              ) : (
                <>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    {ans.responseData?.text || <span className="italic text-slate-400">No response given</span>}
                  </p>
                  {ans.question.gradingGuidance && (
                    <p className="mt-2 text-xs text-slate-500">
                      <span className="font-medium">Guidance:</span> {ans.question.gradingGuidance}
                    </p>
                  )}
                  {alreadyFinalized ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Awarded {ans.pointsAwarded}/{maxPoints} pts
                      {ans.feedback && ` — ${ans.feedback}`}
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <label className="text-sm">
                        <span className="block font-medium text-slate-700">Points (max {maxPoints})</span>
                        <input
                          type="number"
                          min={0}
                          max={maxPoints}
                          value={drafts[ans.id]?.pointsAwarded ?? ""}
                          onChange={(e) =>
                            setDrafts({
                              ...drafts,
                              [ans.id]: { ...drafts[ans.id], pointsAwarded: e.target.value },
                            })
                          }
                          className="input mt-1 w-24"
                        />
                      </label>
                      <label className="flex-1 text-sm">
                        <span className="block font-medium text-slate-700">Feedback</span>
                        <input
                          value={drafts[ans.id]?.feedback ?? ""}
                          onChange={(e) =>
                            setDrafts({ ...drafts, [ans.id]: { ...drafts[ans.id], feedback: e.target.value } })
                          }
                          className="input mt-1"
                        />
                      </label>
                      <button
                        onClick={() => handleGrade(ans.id)}
                        disabled={savingAnswerId === ans.id || drafts[ans.id]?.pointsAwarded === ""}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                      >
                        {savingAnswerId === ans.id ? "Saving…" : ans.pointsAwarded != null ? "Update" : "Save"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!alreadyFinalized && (
        <button
          onClick={handleFinalize}
          disabled={!allGraded || finalizing}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {finalizing
            ? "Finalizing…"
            : allGraded
              ? "Finalize grading"
              : "Grade all responses before finalizing"}
        </button>
      )}
    </div>
  );
}
