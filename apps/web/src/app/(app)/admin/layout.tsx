"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, hasPermission } = useAuth();
  const router = useRouter();
  const authorized = hasPermission("admin.access");

  useEffect(() => {
    if (!loading && !authorized) {
      router.replace("/dashboard");
    }
  }, [loading, authorized, router]);

  if (loading || !authorized) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
