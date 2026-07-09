"use client";

import { useEffect, useState } from "react";
import { assessmentsApi, ApiError } from "@/lib/api-client";

interface Question {
  id: string;
  questionType: string;
  promptText: { text: string };
  points: number;
  options: { id: string; optionText: string; order: number }[];
}

interface Session {
  attemptId: string;
  questions: Question[];
}

interface GradedResult {
  score: number;
  passed: boolean;
  passMarkPercent: number;
  perQuestion: { questionId: string; isCorrect: boolean; correctOptionIds: string[] }[];
}

export function KnowledgeCheck({ lessonId }: { lessonId: string }) {
  const [summary, setSummary] = useState<any | null | undefined>(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<GradedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadSummary() {
    const s = await assessmentsApi.getByLesson(lessonId).catch(() => null);
    setSummary(s);
  }

  useEffect(() => {
    loadSummary();
  }, [lessonId]);

  async function handleStart() {
    setError(null);
    setBusy(true);
    try {
      const started = await assessmentsApi.startAttempt(lessonId);
      setSession({ attemptId: started.attemptId, questions: started.questions });
      setAnswers({});
      setResult(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start the Knowledge Check");
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

  async function handleSubmit() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        answers: session.questions.map((q) => ({
          questionId: q.id,
          selectedOptionIds: answers[q.id] ?? [],
        })),
      };
      const graded = await assessmentsApi.submitAttempt(session.attemptId, payload);
      setResult(graded);
      await loadSummary();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit the Knowledge Check");
    } finally {
      setBusy(false);
    }
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
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Knowledge Check</h3>
        <span className="text-xs text-slate-400">
          Pass mark {summary.passMarkPercent}%
          {summary.maxAttempts ? ` · ${summary.attemptsRemaining} attempt(s) left` : ""}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-900">{summary.title}</p>

      {result ? (
        <div className="mt-4 space-y-4">
          <div
            className={`rounded-xl p-4 text-sm font-medium ${
              result.passed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
          >
            {result.passed ? "Passed" : "Not yet passed"} — Score: {Math.round(result.score)}% (pass mark{" "}
            {result.passMarkPercent}%)
          </div>
          <div className="space-y-3">
            {session?.questions.map((q) => {
              const graded = result.perQuestion.find((p) => p.questionId === q.id);
              const selected = answers[q.id] ?? [];
              return (
                <div key={q.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-sm font-medium text-slate-800">{q.promptText.text}</p>
                  <ul className="mt-2 space-y-1">
                    {q.options.map((o) => {
                      const wasSelected = selected.includes(o.id);
                      const wasCorrect = graded?.correctOptionIds.includes(o.id);
                      return (
                        <li
                          key={o.id}
                          className={`text-sm ${
                            wasCorrect
                              ? "font-medium text-emerald-700"
                              : wasSelected
                                ? "text-red-600"
                                : "text-slate-500"
                          }`}
                        >
                          {wasCorrect ? "✓ " : wasSelected ? "✗ " : "  "}
                          {o.optionText}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
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
      ) : session ? (
        <div className="mt-4 space-y-4">
          {session.questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-800">{q.promptText.text}</p>
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
          {summary.bestScore !== null && (
            <p className="mb-3 text-sm text-slate-600">
              Best score so far: <span className="font-medium">{Math.round(summary.bestScore)}%</span>{" "}
              {summary.passed && <span className="text-emerald-700">(Passed)</span>}
            </p>
          )}
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {noAttemptsLeft ? (
            <p className="text-sm text-slate-500">No attempts remaining for this Knowledge Check.</p>
          ) : (
            <button
              onClick={handleStart}
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy ? "Starting…" : summary.hasInProgressAttempt ? "Resume Knowledge Check" : "Start Knowledge Check"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
