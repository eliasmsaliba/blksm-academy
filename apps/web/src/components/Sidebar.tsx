"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  UserCircle,
  Users,
  ShieldCheck,
  Building2,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission?: string;
}

const learnerNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academies", label: "Academies", icon: GraduationCap, permission: "academy.read" },
  { href: "/profile", label: "My Profile", icon: UserCircle },
];

const adminNav: NavItem[] = [
  { href: "/admin/academies", label: "Academies", icon: GraduationCap, permission: "academy.create" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "user.read" },
  { href: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck, permission: "role.read" },
  { href: "/admin/departments", label: "Departments", icon: Building2, permission: "department.read" },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon size={18} />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const { user, hasPermission, logout } = useAuth();
  const canSeeAdmin = hasPermission("admin.access");

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold">
          B
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">BLKSM Academy</p>
          <p className="text-xs text-slate-400 leading-tight">Learning Platform</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {learnerNav
          .filter((item) => !item.permission || hasPermission(item.permission))
          .map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

        {canSeeAdmin && (
          <>
            <p className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Admin Console
            </p>
            {adminNav
              .filter((item) => !item.permission || hasPermission(item.permission))
              .map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-800 px-3 py-4">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-slate-400">{user?.roles.map((r) => r.name).join(", ")}</p>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
