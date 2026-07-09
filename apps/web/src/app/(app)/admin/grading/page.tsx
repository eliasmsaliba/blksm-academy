"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assessmentsApi, assignmentsApi } from "@/lib/api-client";

export default function GradingQueuePage() {
  const [attempts, setAttempts] = useState<any[] | null>(null);
  const [submissions, setSubmissions] = useState<any[] | null>(null);

  useEffect(() => {
    assessmentsApi.listGrading().then(setAttempts).catch(() => setAttempts([]));
    assignmentsApi.listGrading().then(setSubmissions).catch(() => setSubmissions([]));
  }, []);

  if (attempts === null || submissions === null) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Grading Queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Module Assessment attempts and Practical Assignment submissions awaiting manual grading.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Assessment attempts ({attempts.length})
        </h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing pending.</p>
        ) : (
          <div className="space-y-2">
            {attempts.map((a) => (
              <Link
                key={a.id}
                href={`/admin/grading/attempts/${a.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.assessment.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.user.firstName} {a.user.lastName} &middot; submitted{" "}
                    {new Date(a.submittedAt).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {a.gradingStatus === "PARTIALLY_GRADED" ? "In progress" : "Pending"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Assignment submissions ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing pending.</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => (
              <Link
                key={s.id}
                href={`/admin/grading/submissions/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{s.assignment.title}</p>
                  <p className="text-xs text-slate-500">
                    {s.user.firstName} {s.user.lastName} &middot; submitted{" "}
                    {new Date(s.submittedAt).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Pending
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
