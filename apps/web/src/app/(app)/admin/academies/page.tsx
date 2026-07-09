"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Plus, ArrowRight, Trash2 } from "lucide-react";
import { academiesApi, ApiError } from "@/lib/api-client";

export default function AdminAcademiesPage() {
  const [academies, setAcademies] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setAcademies(await academiesApi.list());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await academiesApi.create({ ...form, status: "PUBLISHED" });
      setForm({ name: "", slug: "", description: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create academy");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this academy and all of its courses?")) return;
    await academiesApi.delete(id);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <GraduationCap size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Academy Management</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Create and structure certification academies.</p>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Plus size={16} className="text-slate-400" />
          Add an academy
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              placeholder="e.g. leadership-academy"
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
          {submitting ? "Creating…" : "Create academy"}
        </button>
      </form>

      <div className="space-y-3">
        {academies.map((academy) => (
          <div
            key={academy.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <GraduationCap size={18} />
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {academy.name}
                  {academy.isDemoData && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      DEMO
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">{academy._count?.courses ?? 0} courses</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/academies/${academy.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Manage courses
                <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => handleDelete(academy.id)}
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
