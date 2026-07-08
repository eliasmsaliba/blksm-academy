"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { lessonsApi, progressApi } from "@/lib/api-client";

function LessonContent({ lessonType, content }: { lessonType: string; content: any }) {
  const url: string | undefined = content?.url;

  switch (lessonType) {
    case "VIDEO":
      return url ? (
        <video controls className="w-full rounded-xl bg-black" src={url} />
      ) : (
        <EmptyContent />
      );
    case "AUDIO":
      return url ? <audio controls className="w-full" src={url} /> : <EmptyContent />;
    case "IMAGE":
      return url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Lesson visual" className="w-full rounded-xl" />
      ) : (
        <EmptyContent />
      );
    case "PDF":
    case "EMBED":
    case "INTERACTIVE":
      return url ? (
        <iframe src={url} className="h-[600px] w-full rounded-xl border border-slate-200" />
      ) : (
        <EmptyContent />
      );
    case "PPTX":
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Open presentation
        </a>
      ) : (
        <EmptyContent />
      );
    case "LINK":
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          {url}
        </a>
      ) : (
        <EmptyContent />
      );
    case "RICH_TEXT":
    default:
      return (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {content?.body ?? "No content yet."}
        </p>
      );
  }
}

function EmptyContent() {
  return <p className="text-sm text-slate-400">No content has been attached to this lesson yet.</p>;
}

export default function LessonViewerPage() {
  const { academyId, courseId, lessonId } = useParams<{
    academyId: string;
    courseId: string;
    lessonId: string;
  }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<any | null>(null);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [marking, setMarking] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const l = await lessonsApi.get(lessonId).catch(() => null);
      if (!l || cancelled) return;
      setLesson(l);
      const list = await lessonsApi.listByModule(l.courseModuleId).catch(() => []);
      if (!cancelled) setSiblings(list);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  async function markComplete() {
    setMarking(true);
    try {
      await progressApi.setLessonProgress(lessonId, { status: "COMPLETED" });
      setCompleted(true);
    } finally {
      setMarking(false);
    }
  }

  if (!lesson) return <p className="text-sm text-slate-500">Loading…</p>;

  const currentIndex = siblings.findIndex((s) => s.id === lessonId);
  const prev = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/academies/${academyId}/courses/${courseId}`}
        className="text-sm text-indigo-600 hover:underline"
      >
        &larr; Back to course
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">{lesson.title}</h1>
        <div className="mt-4">
          <LessonContent lessonType={lesson.lessonType} content={lesson.content} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          disabled={!prev}
          onClick={() =>
            prev && router.push(`/academies/${academyId}/courses/${courseId}/lessons/${prev.id}`)
          }
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          &larr; Previous
        </button>

        <button
          onClick={markComplete}
          disabled={marking || completed}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {completed ? "Completed ✓" : marking ? "Saving…" : "Mark as complete"}
        </button>

        <button
          disabled={!next}
          onClick={() =>
            next && router.push(`/academies/${academyId}/courses/${courseId}/lessons/${next.id}`)
          }
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
