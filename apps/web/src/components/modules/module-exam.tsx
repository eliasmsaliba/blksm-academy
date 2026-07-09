"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { assessmentsApi, ApiError } from "@/lib/api-client";

interface Question {
  id: string;
  questionType: string;
  promptText: { text: string };
  points: number;
  options: { id: string; optionText: string }[];
}

interface Session {
  attemptId: string;
  expiresAt: string | null;
  questions: Question[];
}

interface GradedResult {
  gradingStatus: string;
  awaitingGrading: boolean;
  score: number | null;
  passed: boolean | null;
  passMarkPercent: number;
}

const MANUAL_TYPES = ["SHORT_ANSWER", "ESSAY"];

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ModuleExam({ moduleId }: { moduleId: string }) {
  const [summary, setSummary] = useState<any | null | undefined>(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GradedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const submittingRef = useRef(false);

  async function loadSummary() {
    const s = await assessmentsApi.getByModule(moduleId).catch(() => null);
    setSummary(s);
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const handleSubmit = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        answers: session.questions.map((q) => ({
          questionId: q.id,
          selectedOptionIds: answers[q.id] ?? [],
          responseText: textAnswers[q.id] ?? "",
        })),
      };
      const graded = await assessmentsApi.submitAttempt(session.attemptId, payload);
      setResult(graded);
      await loadSummary();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit the Module Assessment");
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, answers, textAnswers]);

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (!session?.expiresAt) {
      setRemainingSeconds(null);
      return;
    }
    const expiresAt = new Date(session.expiresAt).getTime();
    const tick = () => {
      const secs = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(secs);
      if (secs === 0 && !submittingRef.current) {
        submittingRef.current = true;
        handleSubmitRef.current();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  async function handleStart() {
    setError(null);
    setBusy(true);
    try {
      const started = await assessmentsApi.startModuleAttempt(moduleId);
      setSession({ attemptId: started.attemptId, expiresAt: started.expiresAt, questions: started.questions });
      setAnswers({});
      setTextAnswers({});
      setResult(null);
      submittingRef.current = false;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start the Module Assessment");
    } finally {
      setBusy(false);
    }
  }

  function toggleAnswer(question: Question, optionId: string) {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.questionType === "MCQ_MULTI") {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [question.id]: next };
      }
      return { ...prev, [question.id]: [optionId] };
    });
  }

  function handleTryAgain() {
    setSession(null);
    setResult(null);
  }

  if (summary === undefined) return null;
  if (summary === null) return null;

  const noAttemptsLeft = summary.attemptsRemaining === 0 && !session;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Module Assessment</h3>
        <span className="text-xs text-slate-400">
          Pass mark {summary.passMarkPercent}%
          {summary.maxAttempts ? ` · ${summary.attemptsRemaining} attempt(s) left` : ""}
          {summary.timeLimitMinutes ? ` · ${summary.timeLimitMinutes} min` : ""}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-900">{summary.title}</p>

      {session && remainingSeconds !== null && !result && (
        <div
          className={`mt-3 inline-block rounded-lg px-3 py-1 text-sm font-medium ${
            remainingSeconds < 60 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
          }`}
        >
          Time remaining: {formatTime(remainingSeconds)}
        </div>
      )}

      {result ? (
        result.awaitingGrading ? (
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
            Submitted — awaiting grading from an Assessor. You&rsquo;ll see your final result once it&rsquo;s graded.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div
              className={`rounded-xl p-4 text-sm font-medium ${
                result.passed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              }`}
            >
              {result.passed ? "Passed" : "Not yet passed"} — Score: {Math.round(result.score ?? 0)}% (pass mark{" "}
              {result.passMarkPercent}%)
            </div>
            {(summary.maxAttempts === null || summary.attemptsRemaining > 0) && !result.passed && (
              <button
                onClick={handleTryAgain}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Try again
              </button>
            )}
          </div>
        )
      ) : session ? (
        <div className="mt-4 space-y-4">
          {session.questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-800">{q.promptText.text}</p>
              {MANUAL_TYPES.includes(q.questionType) ? (
                <textarea
                  value={textAnswers[q.id] ?? ""}
                  onChange={(e) => setTextAnswers({ ...textAnswers, [q.id]: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={5}
                  placeholder="Write your answer…"
                />
              ) : (
                <div className="mt-2 space-y-1">
                  {q.options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type={q.questionType === "MCQ_MULTI" ? "checkbox" : "radio"}
                        name={`question-${q.id}`}
                        checked={(answers[q.id] ?? []).includes(o.id)}
                        onChange={() => toggleAnswer(q, o.id)}
                        className="text-indigo-600"
                      />
                      {o.optionText}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit answers"}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          {summary.awaitingGrading && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your last submission is awaiting grading from an Assessor.
            </p>
          )}
          {summary.bestScore !== null && (
            <p className="mb-3 text-sm text-slate-600">
              Best score so far: <span className="font-medium">{Math.round(summary.bestScore)}%</span>{" "}
              {summary.passed && <span className="text-emerald-700">(Passed)</span>}
            </p>
          )}
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {noAttemptsLeft ? (
            <p className="text-sm text-slate-500">No attempts remaining for this Module Assessment.</p>
          ) : (
            <button
              onClick={handleStart}
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy ? "Starting…" : summary.hasInProgressAttempt ? "Resume Module Assessment" : "Start Module Assessment"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
