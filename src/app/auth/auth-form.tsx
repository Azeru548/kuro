"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { defaultDashboardPath } from "@/lib/firebase/users";
import type { UserRole } from "@/lib/types";

export function AuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { firebaseReady, loading, firebaseUser, profile, signIn, signUp, clearError } =
    useAuth();

  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const initialRole = params.get("role") === "helper" ? "helper" : "client";
  const next = params.get("next");

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !firebaseUser || !profile) return;
    const target =
      next && next.startsWith("/")
        ? next
        : defaultDashboardPath(profile.role);
    router.replace(target);
  }, [loading, firebaseUser, profile, next, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    clearError();

    if (!firebaseReady) {
      setMessage(
        "Firebase is not configured. Add keys to .env.local and restart the dev server."
      );
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setMessage("Please enter your full name.");
          return;
        }
        const p = await signUp({
          email,
          password,
          displayName: name,
          role,
        });
        router.replace(
          next && next.startsWith("/") ? next : defaultDashboardPath(p.role)
        );
      } else {
        const p = await signIn({ email, password });
        router.replace(
          next && next.startsWith("/") ? next : defaultDashboardPath(p.role)
        );
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="hero-glow flex min-h-screen items-center justify-center">
        <p className="font-display text-2xl text-purple-900">Loading…</p>
      </div>
    );
  }

  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-4xl text-purple-950">
            Kuro
          </Link>
          <p className="mt-2 text-sm text-stone-600">
            Any email works — school or personal.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <p className="text-sm text-stone-500">
              {mode === "login"
                ? "Log in to continue to your dashboard."
                : "Join as a client (hire help) or a helper (take jobs). Separate accounts if you need both."}
            </p>
          </CardHeader>
          <CardContent>
            {!firebaseReady ? (
              <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Firebase env vars missing. Copy `.env.example` to `.env.local`
                and restart `npm run dev`.
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm text-stone-700">
                      Full name
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ada Okonkwo"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-stone-700">
                      I want to
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["client", "Client — hire help"],
                          ["helper", "Helper — take jobs"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          className={`rounded-xl border px-2 py-2.5 text-xs transition ${
                            role === value
                              ? "border-purple-600 bg-purple-50 text-purple-900"
                              : "border-purple-100 text-stone-600 hover:border-purple-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-stone-500">
                      Only clients can post requests. Helpers use Settings for
                      name, min price, and availability.
                    </p>
                  </div>
                </>
              ) : null}

              <div>
                <label className="mb-1.5 block text-sm text-stone-700">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-stone-700">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </div>

              {message ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  {message}
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting || !firebaseReady}
              >
                {submitting
                  ? mode === "login"
                    ? "Logging in…"
                    : "Creating account…"
                  : mode === "login"
                    ? "Log in"
                    : "Sign up"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-stone-600">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    className="text-purple-700 hover:underline"
                    onClick={() => {
                      setMode("signup");
                      setMessage(null);
                    }}
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-purple-700 hover:underline"
                    onClick={() => {
                      setMode("login");
                      setMessage(null);
                    }}
                  >
                    Log in
                  </button>
                </>
              )}
            </p>

            <p className="mt-6 border-t border-purple-50 pt-5 text-center text-xs text-stone-500">
              Enable <strong>Email/Password</strong> in Firebase Console →
              Authentication → Sign-in method. Create a Firestore database if
              you have not already.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
