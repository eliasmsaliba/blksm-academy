"use client";

import Link from "next/link";
import { Users, ShieldCheck, Building2, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const CARDS = [
  { href: "/admin/academies", label: "Academy Management", icon: GraduationCap, permission: "academy.create" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "user.read" },
  { href: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck, permission: "role.read" },
  { href: "/admin/departments", label: "Departments", icon: Building2, permission: "department.read" },
];

export default function AdminHomePage() {
  const { hasPermission } = useAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Administrative Console</h1>
        <p className="mt-1 text-sm text-slate-500">Manage the platform&rsquo;s structure, people, and access.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.filter((c) => hasPermission(c.permission)).map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <card.icon size={20} />
            </div>
            <p className="font-medium text-slate-900">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
