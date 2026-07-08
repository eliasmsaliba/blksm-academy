"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { courseModulesApi, lessonsApi, attachmentsApi, ApiError } from "@/lib/api-client";

const LESSON_TYPES = [
  "RICH_TEXT",
  "VIDEO",
  "AUDIO",
  "PDF",
  "PPTX",
  "IMAGE",
  "EMBED",
  "LINK",
  "INTERACTIVE",
];

export default function AdminModuleLessonsPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [mod, setMod] = useState<any | null>(null);
  const [form, setForm] = useState({ title: "", lessonType: "RICH_TEXT", body: "", url: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Record<string, any[]>>({});

  async function refresh() {
    const data = await courseModulesApi.get(moduleId);
    setMod(data);
    const entries = await Promise.all(
      (data.lessons ?? []).map(async (l: any) => [
        l.id,
        await attachmentsApi.listForEntity("LESSON", l.id).catch(() => []),
      ]),
    );
    setAttachments(Object.fromEntries(entries));
  }

  useEffect(() => {
    refresh();
  }, [moduleId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const content = form.lessonType === "RICH_TEXT" ? { body: form.body } : { url: form.url };
      await lessonsApi.create({
        courseModuleId: moduleId,
        title: form.title,
        lessonType: form.lessonType,
        content,
        status: "PUBLISHED",
        order: mod?.lessons?.length ?? 0,
      });
      setForm({ title: "", lessonType: "RICH_TEXT", body: "", url: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create lesson");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this lesson?")) return;
    await lessonsApi.delete(id);
    await refresh();
  }

  async function handleUpload(lessonId: string, file: File) {
    setUploadingFor(lessonId);
    try {
      await attachmentsApi.upload(file, "LESSON", lessonId);
      await refresh();
    } finally {
      setUploadingFor(null);
    }
  }

  if (!mod) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/courses/${mod.courseId}`} className="text-sm text-indigo-600 hover:underline">
          &larr; Back to course
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{mod.title}</h1>
        <p className="mt-1 text-sm text-slate-500">Manage lessons within this module.</p>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Add a lesson</h2>
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
            <span className="font-medium text-slate-700">Content type</span>
            <select
              value={form.lessonType}
              onChange={(e) => setForm({ ...form, lessonType: e.target.value })}
              className="input mt-1"
            >
              {LESSON_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          {form.lessonType === "RICH_TEXT" ? (
            <label className="col-span-full block text-sm">
              <span className="font-medium text-slate-700">Body text</span>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="input mt-1"
                rows={4}
              />
            </label>
          ) : (
            <label className="col-span-full block text-sm">
              <span className="font-medium text-slate-700">Content URL</span>
              <input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="input mt-1"
                placeholder="https://…"
              />
            </label>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create lesson"}
        </button>
      </form>

      <div className="space-y-3">
        {mod.lessons?.map((lesson: any) => (
          <div key={lesson.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">
                  {lesson.title}
                  {lesson.isDemoData && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      DEMO
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">{lesson.lessonType}</p>
              </div>
              <button
                onClick={() => handleDelete(lesson.id)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-xs text-slate-500">
                {(attachments[lesson.id] ?? []).length} attachment(s)
              </div>
              <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:underline">
                {uploadingFor === lesson.id ? "Uploading…" : "Upload attachment"}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingFor === lesson.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(lesson.id, file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
