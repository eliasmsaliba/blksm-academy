"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  UserCircle,
  Users,
  ShieldCheck,
  Building2,
  ClipboardCheck,
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
  { href: "/admin/grading", label: "Grading Queue", icon: ClipboardCheck, permission: "assessment.grade" },
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
      <div className="px-5 py-5">
        <div className="inline-flex items-center rounded-lg bg-white px-3 py-2">
          <Image src="/blksm-academy-logo.png" alt="BLKSM Academy" width={130} height={76} priority />
        </div>
        <p className="mt-2 text-xs text-slate-400">Learning Platform</p>
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
