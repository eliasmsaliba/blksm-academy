"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { coursesApi, courseModulesApi, ApiError } from "@/lib/api-client";

export default function AdminCourseModulesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<any | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    learningOutcomes: "",
    deliveryMethod: "",
    resourcesRequired: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setCourse(await coursesApi.get(courseId));
  }

  useEffect(() => {
    refresh();
  }, [courseId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await courseModulesApi.create({
        ...form,
        resourcesRequired: form.resourcesRequired
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        courseId,
        status: "PUBLISHED",
        order: course?.modules?.length ?? 0,
      });
      setForm({ title: "", description: "", learningOutcomes: "", deliveryMethod: "", resourcesRequired: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create module");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this module and all of its lessons?")) return;
    await courseModulesApi.delete(id);
    await refresh();
  }

  if (!course) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/academies/${course.academyId}`} className="text-sm text-indigo-600 hover:underline">
          &larr; Back to {course.academy?.name ?? "academy"}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{course.title}</h1>
        <p className="mt-1 text-sm text-slate-500">Manage modules within this course.</p>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Add a module</h2>
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
            <span className="font-medium text-slate-700">Module Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input mt-1"
              rows={2}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Module Learning Outcomes</span>
            <textarea
              value={form.learningOutcomes}
              onChange={(e) => setForm({ ...form, learningOutcomes: e.target.value })}
              className="input mt-1"
              rows={2}
              placeholder="One outcome per line"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Delivery Method</span>
              <input
                value={form.deliveryMethod}
                onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
                className="input mt-1"
                placeholder="e.g. Self-Paced Online Learning"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Resources Required</span>
              <input
                value={form.resourcesRequired}
                onChange={(e) => setForm({ ...form, resourcesRequired: e.target.value })}
                className="input mt-1"
                placeholder="Comma-separated, e.g. Employee Handbook, Code of Conduct"
              />
            </label>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create module"}
        </button>
      </form>

      <div className="space-y-3">
        {course.modules?.map((mod: any) => (
          <div
            key={mod.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div>
              <p className="font-medium text-slate-900">
                {mod.title}
                {mod.isDemoData && (
                  <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                    DEMO
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-500">{mod.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/modules/${mod.id}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Manage lessons
              </Link>
              <button
                onClick={() => handleDelete(mod.id)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
