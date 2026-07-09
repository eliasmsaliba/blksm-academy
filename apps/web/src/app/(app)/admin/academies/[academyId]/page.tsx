"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Plus, ArrowRight, Trash2 } from "lucide-react";
import { academiesApi, coursesApi, ApiError } from "@/lib/api-client";

export default function AdminAcademyCoursesPage() {
  const { academyId } = useParams<{ academyId: string }>();
  const [academy, setAcademy] = useState<any | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setAcademy(await academiesApi.get(academyId));
  }

  useEffect(() => {
    refresh();
  }, [academyId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await coursesApi.create({ ...form, academyId, status: "PUBLISHED" });
      setForm({ title: "", slug: "", description: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course and all of its modules/lessons?")) return;
    await coursesApi.delete(id);
    await refresh();
  }

  if (!academy) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/academies" className="text-sm text-indigo-600 hover:underline">
          &larr; All academies
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <BookOpen size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{academy.name}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Manage courses within this academy.</p>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Plus size={16} className="text-slate-400" />
          Add a course
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <span className="font-medium text-slate-700">Slug</span>
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="input mt-1"
            />
          </label>
          <label className="col-span-full block text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input mt-1"
              rows={2}
            />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          <Plus size={16} />
          {submitting ? "Creating…" : "Create course"}
        </button>
      </form>

      <div className="space-y-3">
        {academy.courses?.map((course: any) => (
          <div
            key={course.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {course.title}
                  {course.isDemoData && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      DEMO
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">{course.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/courses/${course.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Manage modules
                <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => handleDelete(course.id)}
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
