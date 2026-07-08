"use client";

import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <p className="text-lg font-medium text-slate-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-slate-900">{user.status}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Roles</dt>
            <dd className="font-medium text-slate-900">
              {user.roles.map((r) => r.name).join(", ") || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6">
        <p className="text-sm font-medium text-slate-700">Learning history, competencies & certificates</p>
        <p className="mt-1 text-xs text-slate-400">Available in a future phase.</p>
      </section>
    </div>
  );
}
