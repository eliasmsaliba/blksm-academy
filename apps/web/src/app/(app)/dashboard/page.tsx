"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { enrollmentApi, coursesApi, progressApi } from "@/lib/api-client";

interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  title: string;
  academyId: string;
  status: string;
  percentComplete: number;
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourse[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const enrollments = await enrollmentApi.mine();
        const courseEnrollments = enrollments.filter((e) => e.enrollableType === "COURSE");
        const details = await Promise.all(
          courseEnrollments.map(async (e) => {
            const [course, progress] = await Promise.all([
              coursesApi.get(e.enrollableId).catch(() => null),
              progressApi.myCourseProgress(e.enrollableId).catch(() => null),
            ]);
            return {
              enrollmentId: e.id,
              courseId: e.enrollableId,
              title: course?.title ?? "Unknown course",
              academyId: course?.academyId,
              status: e.status,
              percentComplete: progress?.percentComplete ?? 0,
            } satisfies EnrolledCourse;
          }),
        );
        if (!cancelled) setCourses(details);
      } catch {
        if (!cancelled) setCourses([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const inProgress = courses?.filter((c) => c.percentComplete > 0 && c.percentComplete < 100) ?? [];
  const completed = courses?.filter((c) => c.percentComplete >= 100) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back, {user?.firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here&rsquo;s where you left off.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Courses in progress" value={inProgress.length} />
        <StatCard label="Courses completed" value={completed.length} />
        <StatCard label="Certificates earned" value={0} hint="Coming in Phase 2" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          My Learning
        </h2>
        {courses === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-500">
            You&rsquo;re not enrolled in any courses yet.{" "}
            {hasPermission("academy.read") && (
              <Link href="/academies" className="text-indigo-600 hover:underline">
                Browse the academy catalogue
              </Link>
            )}
          </p>
        ) : (
          <ul className="space-y-3">
            {courses.map((c) => (
              <li key={c.enrollmentId}>
                <Link
                  href={`/academies/${c.academyId}/courses/${c.courseId}`}
                  className="block rounded-xl border border-slate-100 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{c.title}</p>
                    <span className="text-xs text-slate-500">{Math.round(c.percentComplete)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${c.percentComplete}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlaceholderCard title="Upcoming Assessments" />
        <PlaceholderCard title="Certification Compliance" />
        <PlaceholderCard title="Notifications" />
        <PlaceholderCard title="Company Announcements" />
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-400">Available in a future phase.</p>
    </div>
  );
}
