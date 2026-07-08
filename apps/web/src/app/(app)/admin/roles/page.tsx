"use client";

import { useEffect, useMemo, useState } from "react";
import { rolesApi } from "@/lib/api-client";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const [r, p] = await Promise.all([rolesApi.list(), rolesApi.listPermissions()]);
    setRoles(r);
    setPermissions(p);
  }

  useEffect(() => {
    refresh();
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  useEffect(() => {
    if (selectedRole) {
      setSelectedKeys(new Set(selectedRole.rolePermissions.map((rp: any) => rp.permission.key)));
    }
  }, [selectedRole]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const perm of permissions) {
      if (!map.has(perm.resource)) map.set(perm.resource, []);
      map.get(perm.resource)!.push(perm);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  function toggle(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await rolesApi.setPermissions(selectedRoleId, Array.from(selectedKeys));
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Permissions are configurable per role — nothing is hardcoded.
        </p>
      </div>

      <div className="flex gap-6">
        <aside className="w-56 shrink-0 space-y-1">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                selectedRoleId === role.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {role.name}
              <span className="ml-1 text-xs opacity-70">({role.rolePermissions.length})</span>
            </button>
          ))}
        </aside>

        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6">
          {!selectedRole ? (
            <p className="text-sm text-slate-500">Select a role to edit its permissions.</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{selectedRole.name}</h2>
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.map(([resource, perms]) => (
                  <div key={resource} className="rounded-xl border border-slate-100 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {resource}
                    </p>
                    <div className="space-y-1">
                      {perms.map((perm) => (
                        <label key={perm.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedKeys.has(perm.key)}
                            onChange={() => toggle(perm.key)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {perm.action}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
