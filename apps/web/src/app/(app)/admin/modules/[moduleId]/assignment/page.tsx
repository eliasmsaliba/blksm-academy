"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { courseModulesApi, assignmentsApi, ApiError } from "@/lib/api-client";

export default function ModuleAssignmentPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [mod, setMod] = useState<any | null>(null);
  const [assignment, setAssignment] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "Practical Assignment",
    description: "",
    dueDate: "",
    maxPoints: "100",
    rubric: "",
  });
  const [creating, setCreating] = useState(false);

  async function refresh() {
    const [m, a] = await Promise.all([
      courseModulesApi.get(moduleId),
      assignmentsApi.getByModuleAdmin(moduleId).catch(() => null),
    ]);
    setMod(m);
    setAssignment(a);
  }

  useEffect(() => {
    refresh();
  }, [moduleId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await assignmentsApi.create({
        courseModuleId: moduleId,
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
        maxPoints: Number(form.maxPoints),
        rubric: form.rubric || undefined,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create Practical Assignment");
    } finally {
      setCreating(false);
    }
  }

  if (!mod) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href={`/admin/modules/${moduleId}`} className="text-sm text-indigo-600 hover:underline">
          &larr; Back to module
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Practical Assignment</h1>
        <p className="mt-1 text-sm text-slate-500">For module: {mod.title}</p>
      </div>

      {!assignment ? (
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            This module doesn&rsquo;t have a Practical Assignment yet
          </h2>
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Title</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Description / brief</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input mt-1"
                rows={4}
                placeholder="e.g. Write a 750–1500 word reflection on…"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Due Date</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="input mt-1"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Max Points</span>
                <input
                  type="number"
                  min={1}
                  value={form.maxPoints}
                  onChange={(e) => setForm({ ...form, maxPoints: e.target.value })}
                  className="input mt-1"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">
                Rubric <span className="font-normal text-slate-400">(shown to Assessors when grading)</span>
              </span>
              <textarea
                value={form.rubric}
                onChange={(e) => setForm({ ...form, rubric: e.target.value })}
                className="input mt-1"
                rows={4}
              />
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create Practical Assignment"}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">{assignment.title}</h2>
          {assignment.description && <p className="mt-1 text-sm text-slate-600">{assignment.description}</p>}
          <p className="mt-2 text-sm text-slate-500">
            Max points {assignment.maxPoints}
            {assignment.dueDate && ` · Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
            {" · "}
            {assignment.submissions?.length ?? 0} submission(s)
          </p>
          {assignment.submissions?.length > 0 && (
            <ul className="mt-4 space-y-2">
              {assignment.submissions.map((s: any) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span>
                    {s.user.firstName} {s.user.lastName}
                  </span>
                  <span
                    className={
                      s.status === "GRADED" ? "text-emerald-700" : "text-amber-700"
                    }
                  >
                    {s.status === "GRADED" ? `Graded: ${s.grade}/${assignment.maxPoints}` : "Awaiting grading"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-slate-400">
            Grade submissions from the{" "}
            <Link href="/admin/grading" className="text-indigo-600 hover:underline">
              Grading Queue
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
