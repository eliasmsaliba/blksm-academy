"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Layers, Plus, Save, Trash2, ArrowRight } from "lucide-react";
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

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    learningObjectives: "",
    difficultyLevel: "",
    competenciesGained: "",
    estimatedDurationMinutes: "",
  });
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseSaved, setCourseSaved] = useState(false);

  async function refresh() {
    const data = await coursesApi.get(courseId);
    setCourse(data);
    setCourseForm({
      title: data.title ?? "",
      description: data.description ?? "",
      learningObjectives: data.learningObjectives ?? "",
      difficultyLevel: data.difficultyLevel ?? "",
      competenciesGained: data.competenciesGained ?? "",
      estimatedDurationMinutes: data.estimatedDurationMinutes ? String(data.estimatedDurationMinutes) : "",
    });
  }

  useEffect(() => {
    refresh();
  }, [courseId]);

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    setSavingCourse(true);
    setCourseSaved(false);
    try {
      await coursesApi.update(courseId, {
        title: courseForm.title,
        description: courseForm.description,
        learningObjectives: courseForm.learningObjectives,
        difficultyLevel: courseForm.difficultyLevel || undefined,
        competenciesGained: courseForm.competenciesGained,
        estimatedDurationMinutes: courseForm.estimatedDurationMinutes
          ? Number(courseForm.estimatedDurationMinutes)
          : undefined,
      });
      await refresh();
      setCourseSaved(true);
      setTimeout(() => setCourseSaved(false), 2000);
    } finally {
      setSavingCourse(false);
    }
  }

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
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <BookOpen size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{course.title}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Manage this course&rsquo;s details and modules.</p>
      </div>

      <form onSubmit={handleSaveCourse} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <BookOpen size={16} className="text-slate-400" />
          Course Details
        </h2>
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Title</span>
            <input
              required
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              className="input mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="input mt-1"
              rows={3}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Learning Objectives</span>
            <textarea
              value={courseForm.learningObjectives}
              onChange={(e) => setCourseForm({ ...courseForm, learningObjectives: e.target.value })}
              className="input mt-1"
              rows={3}
              placeholder="One objective per line"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Difficulty Level</span>
              <input
                value={courseForm.difficultyLevel}
                onChange={(e) => setCourseForm({ ...courseForm, difficultyLevel: e.target.value })}
                className="input mt-1"
                placeholder="e.g. Foundation, Intermediate"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Estimated Duration (minutes)</span>
              <input
                type="number"
                min={0}
                value={courseForm.estimatedDurationMinutes}
                onChange={(e) => setCourseForm({ ...courseForm, estimatedDurationMinutes: e.target.value })}
                className="input mt-1"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Competencies Gained</span>
            <textarea
              value={courseForm.competenciesGained}
              onChange={(e) => setCourseForm({ ...courseForm, competenciesGained: e.target.value })}
              className="input mt-1"
              rows={2}
              placeholder="One competency per line"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={savingCourse}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            <Save size={16} />
            {savingCourse ? "Saving…" : "Save course details"}
          </button>
          {courseSaved && <span className="text-sm font-medium text-emerald-700">Saved</span>}
        </div>
      </form>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Layers size={16} className="text-slate-400" />
          Add a module
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
          className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          <Plus size={16} />
          {submitting ? "Creating…" : "Create module"}
        </button>
      </form>

      <div className="space-y-3">
        {course.modules?.map((mod: any) => (
          <div
            key={mod.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Layers size={18} />
              </div>
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
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/modules/${mod.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Manage lessons
                <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => handleDelete(mod.id)}
                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
