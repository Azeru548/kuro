"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  canAccessRole,
  defaultDashboardPath,
} from "@/lib/firebase/users";

export function AuthGate({
  children,
  dashboard,
}: {
  children: React.ReactNode;
  dashboard: "client" | "helper";
}) {
  const { firebaseReady, loading, firebaseUser, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // No Firebase keys: allow demo browsing of dashboards
    if (!firebaseReady) return;

    if (!firebaseUser) {
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (profile && !canAccessRole(profile.role, dashboard)) {
      router.replace(defaultDashboardPath(profile.role));
    }
  }, [
    loading,
    firebaseReady,
    firebaseUser,
    profile,
    dashboard,
    router,
    pathname,
  ]);

  if (!firebaseReady) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3fc]">
        <div className="text-center">
          <p className="font-display text-3xl text-purple-900">Kuro</p>
          <p className="mt-2 text-sm text-stone-500">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3fc]">
        <p className="text-sm text-stone-500">Redirecting to log in…</p>
      </div>
    );
  }

  if (profile && !canAccessRole(profile.role, dashboard)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3fc]">
        <p className="text-sm text-stone-500">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return <>{children}</>;
}
