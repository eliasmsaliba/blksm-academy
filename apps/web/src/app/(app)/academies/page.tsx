"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { academiesApi } from "@/lib/api-client";

export default function AcademiesPage() {
  const [academies, setAcademies] = useState<any[] | null>(null);

  useEffect(() => {
    academiesApi.list().then(setAcademies).catch(() => setAcademies([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Academy Catalogue</h1>
        <p className="mt-1 text-sm text-slate-500">Explore certification programmes across BLKSM Academy.</p>
      </div>

      {academies === null ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : academies.length === 0 ? (
        <p className="text-sm text-slate-500">No academies published yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {academies.map((academy) => (
            <Link
              key={academy.id}
              href={`/academies/${academy.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <GraduationCap size={20} />
              </div>
              <p className="font-medium text-slate-900">{academy.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{academy.description}</p>
              <p className="mt-3 text-xs text-slate-400">{academy._count?.courses ?? 0} courses</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
