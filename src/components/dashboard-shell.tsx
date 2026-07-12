"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { canAccessRole } from "@/lib/firebase/users";
import {
  BookOpen,
  Briefcase,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusCircle,
  Settings,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const clientNav: NavItem[] = [
  { href: "/client", label: "Overview", icon: LayoutDashboard },
  { href: "/client/requests/new", label: "New request", icon: PlusCircle },
  { href: "/client/jobs", label: "My jobs", icon: Briefcase },
  { href: "/client/history", label: "History", icon: History },
  { href: "/client/messages", label: "Messages", icon: MessageSquare },
];

const helperNav: NavItem[] = [
  { href: "/helper", label: "Overview", icon: LayoutDashboard },
  { href: "/helper/inbox", label: "Inbox", icon: Inbox },
  { href: "/helper/jobs", label: "My projects", icon: BookOpen },
  { href: "/helper/earnings", label: "Earnings", icon: Wallet },
  { href: "/helper/messages", label: "Messages", icon: MessageSquare },
  { href: "/helper/profile", label: "Profile", icon: Settings },
];

export function DashboardShell({
  role,
  title,
  subtitle,
  children,
}: {
  role: "client" | "helper";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, firebaseReady, logOut } = useAuth();
  const nav = role === "client" ? clientNav : helperNav;

  const displayName = profile?.displayName ?? "Guest";
  const canSwitch =
    !profile ||
    profile.role === "both" ||
    profile.role === "admin" ||
    canAccessRole(profile.role, role === "client" ? "helper" : "client");

  async function handleLogout() {
    await logOut();
    router.replace("/auth");
  }

  return (
    <div className="min-h-screen bg-[#f7f3fc]">
      <div className="border-b border-purple-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-xs font-semibold text-white">
              K
            </span>
            <span className="font-display text-xl text-purple-950">Kuro</span>
          </Link>
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            {canSwitch ? (
              <Link
                href={role === "client" ? "/helper" : "/client"}
                className="hidden text-purple-700 hover:underline sm:inline"
              >
                Switch to {role === "client" ? "helper" : "client"}
              </Link>
            ) : null}
            <span className="hidden max-w-[140px] truncate text-stone-600 sm:inline">
              {displayName}
            </span>
            {firebaseReady && profile ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            ) : (
              <Link href="/auth" className="text-purple-700 hover:underline">
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-purple-100 bg-white p-3 shadow-sm">
          <p className="mb-2 px-3 font-display text-lg text-purple-900 capitalize">
            {role}
          </p>
          <p className="mb-3 truncate px-3 text-xs text-stone-500 sm:hidden">
            {displayName}
          </p>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== `/${role}` && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-purple-700 text-white shadow-sm"
                      : "text-stone-600 hover:bg-purple-50 hover:text-purple-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>
          <div className="mb-6">
            <h1 className="font-display text-3xl text-purple-950 sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-sm text-stone-600">{subtitle}</p>
            ) : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
