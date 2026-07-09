"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ClipboardCheck,
  NotebookPen,
  HelpCircle,
  Trash2,
  Plus,
  Pencil,
  X,
  Save,
  UploadCloud,
  Paperclip,
  FileText,
  Video,
  Music,
  Presentation,
  Image as ImageIcon,
  Code2,
  Link2,
  MonitorPlay,
} from "lucide-react";
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

const LESSON_TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  RICH_TEXT: FileText,
  VIDEO: Video,
  AUDIO: Music,
  PDF: FileText,
  PPTX: Presentation,
  IMAGE: ImageIcon,
  EMBED: Code2,
  LINK: Link2,
  INTERACTIVE: MonitorPlay,
};

interface Section {
  heading: string;
  body: string;
}

interface LessonFormState {
  title: string;
  lessonType: string;
  estimatedDurationMinutes: string;
  url: string;
  lessonCode: string;
  competenciesDeveloped: string;
  introduction: string;
  learningOutcomes: string;
  leadershipThought: string;
  reflection: string;
}

const emptyLessonForm: LessonFormState = {
  title: "",
  lessonType: "RICH_TEXT",
  estimatedDurationMinutes: "",
  url: "",
  lessonCode: "",
  competenciesDeveloped: "",
  introduction: "",
  learningOutcomes: "",
  leadershipThought: "",
  reflection: "",
};

/** Reverse-maps a saved lesson back into editable form state. Lessons saved
 * before the structured-v1 format existed just get their old flat body text
 * dropped into Introduction, giving admins a starting point to restructure. */
function lessonToFormState(lesson: any): { form: LessonFormState; sections: Section[] } {
  const content = lesson.content ?? {};
  const isStructured = content.format === "structured-v1";
  return {
    form: {
      title: lesson.title ?? "",
      lessonType: lesson.lessonType ?? "RICH_TEXT",
      estimatedDurationMinutes: lesson.estimatedDurationMinutes ? String(lesson.estimatedDurationMinutes) : "",
      url: !isStructured ? content.url ?? "" : "",
      lessonCode: isStructured ? content.lessonCode ?? "" : "",
      competenciesDeveloped: isStructured ? (content.competenciesDeveloped ?? []).join(", ") : "",
      introduction: isStructured ? content.introduction ?? "" : content.body ?? "",
      learningOutcomes: isStructured ? (content.learningOutcomes ?? []).join("\n") : "",
      leadershipThought: isStructured ? content.leadershipThought ?? "" : "",
      reflection: isStructured ? content.reflection ?? "" : "",
    },
    sections: isStructured && content.sections?.length ? content.sections : [{ heading: "", body: "" }],
  };
}

function buildLessonContent(form: LessonFormState, sections: Section[]) {
  if (form.lessonType !== "RICH_TEXT") return { url: form.url };
  return {
    format: "structured-v1",
    lessonCode: form.lessonCode || undefined,
    competenciesDeveloped: form.competenciesDeveloped
      ? form.competenciesDeveloped.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    introduction: form.introduction || undefined,
    learningOutcomes: form.learningOutcomes
      ? form.learningOutcomes.split("\n").map((s) => s.trim()).filter(Boolean)
      : undefined,
    leadershipThought: form.leadershipThought || undefined,
    sections: sections.filter((s) => s.heading.trim() || s.body.trim()),
    reflection: form.reflection || undefined,
  };
}

function LessonFields({
  form,
  setForm,
  sections,
  setSections,
}: {
  form: LessonFormState;
  setForm: (f: LessonFormState) => void;
  sections: Section[];
  setSections: (s: Section[]) => void;
}) {
  function addSection() {
    setSections([...sections, { heading: "", body: "" }]);
  }
  function updateSection(i: number, field: keyof Section, value: string) {
    setSections(sections.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }
  function removeSection(i: number) {
    setSections(sections.filter((_, idx) => idx !== i));
  }

  return (
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
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Duration (minutes)</span>
        <input
          type="number"
          min={0}
          value={form.estimatedDurationMinutes}
          onChange={(e) => setForm({ ...form, estimatedDurationMinutes: e.target.value })}
          className="input mt-1"
        />
      </label>

      {form.lessonType === "RICH_TEXT" ? (
        <>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Lesson Code</span>
            <input
              value={form.lessonCode}
              onChange={(e) => setForm({ ...form, lessonCode: e.target.value })}
              className="input mt-1"
              placeholder="e.g. FND-101-M01-L03"
            />
          </label>
          <label className="col-span-full block text-sm">
            <span className="font-medium text-slate-700">Competencies Developed</span>
            <input
              value={form.competenciesDeveloped}
              onChange={(e) => setForm({ ...form, competenciesDeveloped: e.target.value })}
              className="input mt-1"
              placeholder="Comma-separated"
            />
          </label>
          <label className="col-span-full block text-sm">
            <span className="font-medium text-slate-700">Introduction</span>
            <textarea
              value={form.introduction}
              onChange={(e) => setForm({ ...form, introduction: e.target.value })}
              className="input mt-1"
              rows={3}
            />
          </label>
          <label className="col-span-full block text-sm">
            <span className="font-medium text-slate-700">Learning Outcomes</span>
            <textarea
              value={form.learningOutcomes}
              onChange={(e) => setForm({ ...form, learningOutcomes: e.target.value })}
              className="input mt-1"
              rows={3}
              placeholder="One outcome per line"
            />
          </label>
          <label className="col-span-full block text-sm">
            <span className="font-medium text-slate-700">Leadership Thought</span>
            <textarea
              value={form.leadershipThought}
              onChange={(e) => setForm({ ...form, leadershipThought: e.target.value })}
              className="input mt-1"
              rows={2}
              placeholder="A short inspirational quote"
            />
          </label>

          <div className="col-span-full space-y-3 rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Content Sections</span>
              <button
                type="button"
                onClick={addSection}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                + Add section
              </button>
            </div>
            {sections.map((s, i) => (
              <div key={i} className="space-y-2 rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={s.heading}
                    onChange={(e) => updateSection(i, "heading", e.target.value)}
                    className="input"
                    placeholder="Section heading"
                  />
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(i)}
                      className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  value={s.body}
                  onChange={(e) => updateSection(i, "body", e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Section body text"
                />
              </div>
            ))}
          </div>

          <label className="col-span-full block text-sm">
            <span className="font-medium text-slate-700">Reflection</span>
            <textarea
              value={form.reflection}
              onChange={(e) => setForm({ ...form, reflection: e.target.value })}
              className="input mt-1"
              rows={2}
              placeholder="A short closing inspirational message"
            />
          </label>
        </>
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
  );
}

export default function AdminModuleLessonsPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [mod, setMod] = useState<any | null>(null);

  // Module overview edit state
  const [moduleForm, setModuleForm] = useState({
    description: "",
    learningOutcomes: "",
    deliveryMethod: "",
    resourcesRequired: "",
  });
  const [savingModule, setSavingModule] = useState(false);

  // Lesson create state
  const [form, setForm] = useState<LessonFormState>(emptyLessonForm);
  const [sections, setSections] = useState<Section[]>([{ heading: "", body: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Record<string, any[]>>({});

  // Lesson edit state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LessonFormState>(emptyLessonForm);
  const [editSections, setEditSections] = useState<Section[]>([{ heading: "", body: "" }]);
  const [savingLesson, setSavingLesson] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function refresh() {
    const data = await courseModulesApi.get(moduleId);
    setMod(data);
    setModuleForm({
      description: data.description ?? "",
      learningOutcomes: data.learningOutcomes ?? "",
      deliveryMethod: data.deliveryMethod ?? "",
      resourcesRequired: (data.resourcesRequired ?? []).join(", "),
    });
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

  async function handleSaveModule(e: React.FormEvent) {
    e.preventDefault();
    setSavingModule(true);
    try {
      await courseModulesApi.update(moduleId, {
        description: moduleForm.description,
        learningOutcomes: moduleForm.learningOutcomes,
        deliveryMethod: moduleForm.deliveryMethod,
        resourcesRequired: moduleForm.resourcesRequired
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await refresh();
    } finally {
      setSavingModule(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await lessonsApi.create({
        courseModuleId: moduleId,
        title: form.title,
        lessonType: form.lessonType,
        content: buildLessonContent(form, sections),
        estimatedDurationMinutes: form.estimatedDurationMinutes ? Number(form.estimatedDurationMinutes) : undefined,
        status: "PUBLISHED",
        order: mod?.lessons?.length ?? 0,
      });
      setForm(emptyLessonForm);
      setSections([{ heading: "", body: "" }]);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create lesson");
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartEdit(lesson: any) {
    const { form: f, sections: s } = lessonToFormState(lesson);
    setEditForm(f);
    setEditSections(s);
    setEditError(null);
    setEditingLessonId(lesson.id);
  }

  function handleCancelEdit() {
    setEditingLessonId(null);
    setEditError(null);
  }

  async function handleSaveEdit(e: React.FormEvent, lessonId: string) {
    e.preventDefault();
    setEditError(null);
    setSavingLesson(true);
    try {
      await lessonsApi.update(lessonId, {
        title: editForm.title,
        lessonType: editForm.lessonType,
        content: buildLessonContent(editForm, editSections),
        estimatedDurationMinutes: editForm.estimatedDurationMinutes ? Number(editForm.estimatedDurationMinutes) : undefined,
      });
      setEditingLessonId(null);
      await refresh();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Failed to save lesson");
    } finally {
      setSavingLesson(false);
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

  const totalStudyMinutes = (mod.lessons ?? []).reduce(
    (sum: number, l: any) => sum + (l.estimatedDurationMinutes ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/courses/${mod.courseId}`} className="text-sm text-indigo-600 hover:underline">
          &larr; Back to course
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Layers size={20} />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">{mod.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/modules/${moduleId}/assessment`}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
            >
              <ClipboardCheck size={16} />
              Module Assessment
            </Link>
            <Link
              href={`/admin/modules/${moduleId}/assignment`}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
            >
              <NotebookPen size={16} />
              Practical Assignment
            </Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-500">Manage this module&rsquo;s overview and lessons.</p>
      </div>

      <form onSubmit={handleSaveModule} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Layers size={16} className="text-slate-400" />
          Module Overview
        </h2>
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Module Description</span>
            <textarea
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              className="input mt-1"
              rows={3}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Module Learning Outcomes</span>
            <textarea
              value={moduleForm.learningOutcomes}
              onChange={(e) => setModuleForm({ ...moduleForm, learningOutcomes: e.target.value })}
              className="input mt-1"
              rows={3}
              placeholder="One outcome per line"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Delivery Method</span>
              <input
                value={moduleForm.deliveryMethod}
                onChange={(e) => setModuleForm({ ...moduleForm, deliveryMethod: e.target.value })}
                className="input mt-1"
                placeholder="e.g. Self-Paced Online Learning"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Resources Required</span>
              <input
                value={moduleForm.resourcesRequired}
                onChange={(e) => setModuleForm({ ...moduleForm, resourcesRequired: e.target.value })}
                className="input mt-1"
                placeholder="Comma-separated"
              />
            </label>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Estimated Study Time: <span className="font-medium">{totalStudyMinutes} minutes</span> across{" "}
            {(mod.lessons ?? []).length} lesson(s) — calculated automatically from each lesson&rsquo;s duration.
          </div>
        </div>
        <button
          type="submit"
          disabled={savingModule}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {savingModule ? "Saving…" : "Save module overview"}
        </button>
      </form>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Add a lesson</h2>
        <LessonFields form={form} setForm={setForm} sections={sections} setSections={setSections} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          <Plus size={16} />
          {submitting ? "Creating…" : "Create lesson"}
        </button>
      </form>

      <div className="space-y-3">
        {mod.lessons?.map((lesson: any) => {
          const TypeIcon = LESSON_TYPE_ICONS[lesson.lessonType] ?? FileText;
          const isEditing = editingLessonId === lesson.id;
          return (
            <div key={lesson.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              {isEditing ? (
                <form onSubmit={(e) => handleSaveEdit(e, lesson.id)}>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Pencil size={16} className="text-slate-400" />
                    Editing: {lesson.title}
                  </h2>
                  <LessonFields form={editForm} setForm={setEditForm} sections={editSections} setSections={setEditSections} />
                  {editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={savingLesson}
                      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                      <Save size={16} />
                      {savingLesson ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <TypeIcon size={18} />
                      </div>
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
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleStartEdit(lesson)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:underline"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      {lesson.lessonType === "RICH_TEXT" && (
                        <Link
                          href={`/admin/lessons/${lesson.id}/knowledge-check`}
                          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                        >
                          <HelpCircle size={14} />
                          Knowledge Check
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Paperclip size={13} />
                      {(attachments[lesson.id] ?? []).length} attachment(s)
                    </div>
                    <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
                      <UploadCloud size={14} />
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
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
