"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { coursesApi, courseModulesApi, progressApi } from "@/lib/api-client";

export default function CourseDetailPage() {
  const { academyId, courseId } = useParams<{ academyId: string; courseId: string }>();
  const [course, setCourse] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [progress, setProgress] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const c = await coursesApi.get(courseId).catch(() => null);
      if (!c || cancelled) return;
      setCourse(c);
      const withLessons = await Promise.all(
        (c.modules ?? []).map((m: any) => courseModulesApi.get(m.id).catch(() => m)),
      );
      if (!cancelled) setModules(withLessons);
      progressApi
        .myCourseProgress(courseId)
        .then((p) => !cancelled && setProgress(p))
        .catch(() => {});
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!course) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href={`/academies/${academyId}`} className="text-sm text-indigo-600 hover:underline">
          &larr; Back to academy
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{course.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{course.description}</p>
      </div>

      {progress && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Your progress</span>
            <span className="text-slate-500">{Math.round(progress.percentComplete)}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {modules.map((mod, idx) => (
          <section key={mod.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              {idx + 1}. {mod.title}
            </h2>
            {mod.description && <p className="mt-1 text-sm text-slate-500">{mod.description}</p>}
            <ul className="mt-3 space-y-1">
              {(mod.lessons ?? []).map((lesson: any) => (
                <li key={lesson.id}>
                  <Link
                    href={`/academies/${academyId}/courses/${courseId}/lessons/${lesson.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <PlayCircle size={16} className="text-slate-400" />
                    {lesson.title}
                  </Link>
                </li>
              ))}
              {(mod.lessons ?? []).length === 0 && (
                <li className="px-3 py-2 text-sm text-slate-400">No lessons yet.</li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
