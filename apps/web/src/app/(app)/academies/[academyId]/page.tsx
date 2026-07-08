"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { academiesApi, enrollmentApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function AcademyDetailPage() {
  const { academyId } = useParams<{ academyId: string }>();
  const { user, hasPermission } = useAuth();
  const [academy, setAcademy] = useState<any | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    academiesApi.get(academyId).then(setAcademy).catch(() => setAcademy(null));
    enrollmentApi
      .mine()
      .then((rows) => setEnrolledCourseIds(new Set(rows.map((r) => r.enrollableId))))
      .catch(() => {});
  }, [academyId]);

  async function enroll(courseId: string) {
    if (!user) return;
    setEnrolling(courseId);
    try {
      await enrollmentApi.enrollSelf("COURSE", courseId);
    } finally {
      setEnrolling(null);
      setEnrolledCourseIds((prev) => new Set(prev).add(courseId));
    }
  }

  if (!academy) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{academy.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{academy.description}</p>
      </div>

      <section className="space-y-3">
        {academy.courses?.length === 0 && (
          <p className="text-sm text-slate-500">No courses published in this academy yet.</p>
        )}
        {academy.courses?.map((course: any) => {
          const enrolled = enrolledCourseIds.has(course.id);
          return (
            <div
              key={course.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div>
                <Link
                  href={`/academies/${academyId}/courses/${course.id}`}
                  className="font-medium text-slate-900 hover:text-indigo-600"
                >
                  {course.title}
                </Link>
                <p className="mt-1 text-sm text-slate-500">{course.description}</p>
                {course.estimatedDurationMinutes && (
                  <p className="mt-1 text-xs text-slate-400">
                    ~{course.estimatedDurationMinutes} min &middot; {course.difficultyLevel ?? "General"}
                  </p>
                )}
              </div>
              {!hasPermission("admin.access") &&
                (enrolled ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Enrolled
                  </span>
                ) : (
                  <button
                    onClick={() => enroll(course.id)}
                    disabled={enrolling === course.id}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {enrolling === course.id ? "Enrolling…" : "Enroll"}
                  </button>
                ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}
