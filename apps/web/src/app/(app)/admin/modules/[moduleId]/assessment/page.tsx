"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { courseModulesApi, assessmentsApi, questionsApi, ApiError } from "@/lib/api-client";

interface OptionRow {
  optionText: string;
  isCorrect: boolean;
}

const QUESTION_TYPES = ["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"];
const MANUAL_TYPES = ["SHORT_ANSWER", "ESSAY"];

function defaultOptions(questionType: string): OptionRow[] {
  if (questionType === "TRUE_FALSE") {
    return [
      { optionText: "True", isCorrect: true },
      { optionText: "False", isCorrect: false },
    ];
  }
  return [
    { optionText: "", isCorrect: true },
    { optionText: "", isCorrect: false },
  ];
}

export default function ModuleAssessmentPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [mod, setMod] = useState<any | null>(null);
  const [assessment, setAssessment] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [assessmentForm, setAssessmentForm] = useState({
    title: "Module Assessment",
    passMarkPercent: "70",
    maxAttempts: "1",
    timeLimitMinutes: "45",
    questionPoolSize: "25",
    randomizeQuestions: true,
    randomizeAnswers: true,
  });
  const [creatingAssessment, setCreatingAssessment] = useState(false);

  const [qForm, setQForm] = useState({
    questionType: "MCQ_SINGLE",
    promptText: "",
    points: "1",
    gradingGuidance: "",
  });
  const [options, setOptions] = useState<OptionRow[]>(defaultOptions("MCQ_SINGLE"));
  const [savingQuestion, setSavingQuestion] = useState(false);

  async function refresh() {
    const [m, a] = await Promise.all([
      courseModulesApi.get(moduleId),
      assessmentsApi.getByModuleAdmin(moduleId).catch(() => null),
    ]);
    setMod(m);
    setAssessment(a);
  }

  useEffect(() => {
    refresh();
  }, [moduleId]);

  async function handleCreateAssessment(e: React.FormEvent) {
    e.preventDefault();
    setCreatingAssessment(true);
    setError(null);
    try {
      await assessmentsApi.create({
        courseModuleId: moduleId,
        assessmentKind: "EXAM",
        title: assessmentForm.title,
        passMarkPercent: Number(assessmentForm.passMarkPercent),
        maxAttempts: assessmentForm.maxAttempts ? Number(assessmentForm.maxAttempts) : undefined,
        timeLimitMinutes: assessmentForm.timeLimitMinutes ? Number(assessmentForm.timeLimitMinutes) : undefined,
        questionPoolSize: assessmentForm.questionPoolSize ? Number(assessmentForm.questionPoolSize) : undefined,
        randomizeQuestions: assessmentForm.randomizeQuestions,
        randomizeAnswers: assessmentForm.randomizeAnswers,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create Module Assessment");
    } finally {
      setCreatingAssessment(false);
    }
  }

  function handleQuestionTypeChange(questionType: string) {
    setQForm({ ...qForm, questionType });
    setOptions(defaultOptions(questionType));
  }

  function updateOption(i: number, field: keyof OptionRow, value: string | boolean) {
    setOptions(options.map((o, idx) => (idx === i ? { ...o, [field]: value } : o)));
  }

  function setCorrectSingle(i: number) {
    setOptions(options.map((o, idx) => ({ ...o, isCorrect: idx === i })));
  }

  function addOption() {
    setOptions([...options, { optionText: "", isCorrect: false }]);
  }

  function removeOption(i: number) {
    setOptions(options.filter((_, idx) => idx !== i));
  }

  const isManual = MANUAL_TYPES.includes(qForm.questionType);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSavingQuestion(true);
    setError(null);
    try {
      const question = await questionsApi.create({
        questionType: qForm.questionType,
        promptText: qForm.promptText,
        points: Number(qForm.points),
        gradingGuidance: isManual ? qForm.gradingGuidance || undefined : undefined,
        options: isManual ? undefined : options,
      });
      await assessmentsApi.addQuestion(assessment.id, { questionId: question.id });
      setQForm({ questionType: "MCQ_SINGLE", promptText: "", points: "1", gradingGuidance: "" });
      setOptions(defaultOptions("MCQ_SINGLE"));
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add question");
    } finally {
      setSavingQuestion(false);
    }
  }

  async function handleRemoveQuestion(questionId: string) {
    if (!confirm("Remove this question from the Module Assessment?")) return;
    await assessmentsApi.removeQuestion(assessment.id, questionId);
    await refresh();
  }

  if (!mod) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href={`/admin/modules/${moduleId}`} className="text-sm text-indigo-600 hover:underline">
          &larr; Back to module
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Module Assessment</h1>
        <p className="mt-1 text-sm text-slate-500">For module: {mod.title}</p>
      </div>

      {!assessment ? (
        <form onSubmit={handleCreateAssessment} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            This module doesn&rsquo;t have an assessment yet
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Title</span>
              <input
                required
                value={assessmentForm.title}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                className="input mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Pass Mark %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={assessmentForm.passMarkPercent}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, passMarkPercent: e.target.value })}
                className="input mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Max Attempts</span>
              <input
                type="number"
                min={1}
                value={assessmentForm.maxAttempts}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, maxAttempts: e.target.value })}
                className="input mt-1"
                placeholder="Leave blank for unlimited"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Time Limit (minutes)</span>
              <input
                type="number"
                min={1}
                value={assessmentForm.timeLimitMinutes}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, timeLimitMinutes: e.target.value })}
                className="input mt-1"
                placeholder="Leave blank for untimed"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Questions shown per attempt</span>
              <input
                type="number"
                min={1}
                value={assessmentForm.questionPoolSize}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, questionPoolSize: e.target.value })}
                className="input mt-1"
                placeholder="Leave blank to show all"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-1">
              <input
                type="checkbox"
                checked={assessmentForm.randomizeQuestions}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, randomizeQuestions: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span className="font-medium text-slate-700">Randomize question order</span>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-1">
              <input
                type="checkbox"
                checked={assessmentForm.randomizeAnswers}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, randomizeAnswers: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span className="font-medium text-slate-700">Randomize answer order</span>
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={creatingAssessment}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {creatingAssessment ? "Creating…" : "Create Module Assessment"}
          </button>
        </form>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">{assessment.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pass mark {assessment.passMarkPercent}% &middot;{" "}
              {assessment.maxAttempts ? `${assessment.maxAttempts} attempts allowed` : "Unlimited attempts"} &middot;{" "}
              {assessment.timeLimitMinutes ? `${assessment.timeLimitMinutes} min timer` : "Untimed"} &middot;{" "}
              {assessment.questionPoolSize
                ? `${assessment.questionPoolSize} of ${assessment.assessmentQuestions?.length ?? 0} shown per attempt`
                : `${assessment.assessmentQuestions?.length ?? 0} question(s)`}
            </p>
          </div>

          <form onSubmit={handleAddQuestion} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Add a question to the bank</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Question Type</span>
                  <select
                    value={qForm.questionType}
                    onChange={(e) => handleQuestionTypeChange(e.target.value)}
                    className="input mt-1"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Points</span>
                  <input
                    type="number"
                    min={1}
                    value={qForm.points}
                    onChange={(e) => setQForm({ ...qForm, points: e.target.value })}
                    className="input mt-1"
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Question Text</span>
                <textarea
                  required
                  value={qForm.promptText}
                  onChange={(e) => setQForm({ ...qForm, promptText: e.target.value })}
                  className="input mt-1"
                  rows={2}
                />
              </label>

              {isManual ? (
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">
                    Grading guidance <span className="font-normal text-slate-400">(visible to Assessors only)</span>
                  </span>
                  <textarea
                    value={qForm.gradingGuidance}
                    onChange={(e) => setQForm({ ...qForm, gradingGuidance: e.target.value })}
                    className="input mt-1"
                    rows={3}
                    placeholder="Model answer or rubric notes for the Assessor grading this response"
                  />
                </label>
              ) : (
                <div className="space-y-2 rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Answer Options {qForm.questionType === "MCQ_SINGLE" && "(select the one correct answer)"}
                      {qForm.questionType === "MCQ_MULTI" && "(check all correct answers)"}
                    </span>
                    {qForm.questionType !== "TRUE_FALSE" && (
                      <button type="button" onClick={addOption} className="text-xs font-medium text-indigo-600 hover:underline">
                        + Add option
                      </button>
                    )}
                  </div>
                  {options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {qForm.questionType === "MCQ_MULTI" ? (
                        <input
                          type="checkbox"
                          checked={o.isCorrect}
                          onChange={(e) => updateOption(i, "isCorrect", e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                      ) : (
                        <input
                          type="radio"
                          name="correct-option"
                          checked={o.isCorrect}
                          onChange={() => setCorrectSingle(i)}
                          className="border-slate-300 text-indigo-600"
                        />
                      )}
                      <input
                        value={o.optionText}
                        disabled={qForm.questionType === "TRUE_FALSE"}
                        onChange={(e) => updateOption(i, "optionText", e.target.value)}
                        className="input flex-1"
                        placeholder="Option text"
                      />
                      {qForm.questionType !== "TRUE_FALSE" && options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={savingQuestion}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {savingQuestion ? "Saving…" : "Add question"}
            </button>
          </form>

          <div className="space-y-3">
            {assessment.assessmentQuestions?.map((aq: any, i: number) => {
              const q = aq.question;
              const manual = MANUAL_TYPES.includes(q.questionType);
              return (
                <div key={aq.questionId} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-slate-900">
                      {i + 1}. {q.promptText?.text}{" "}
                      {manual && (
                        <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-normal text-amber-700">
                          Manually graded
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => handleRemoveQuestion(aq.questionId)}
                      className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  {manual ? (
                    q.gradingGuidance && (
                      <p className="mt-2 text-sm text-slate-500">
                        <span className="font-medium">Guidance:</span> {q.gradingGuidance}
                      </p>
                    )
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {q.options?.map((o: any) => (
                        <li
                          key={o.id}
                          className={`text-sm ${o.isCorrect ? "font-medium text-emerald-700" : "text-slate-600"}`}
                        >
                          {o.isCorrect ? "✓ " : "  "}
                          {o.optionText}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
