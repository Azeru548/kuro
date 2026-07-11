"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isFirebaseConfigured } from "@/lib/firebase/client";

export function AuthForm() {
  const params = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const initialRole = params.get("role") === "helper" ? "helper" : "client";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [role, setRole] = useState<"client" | "helper" | "both">(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const firebaseReady = useMemo(() => isFirebaseConfigured(), []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseReady) {
      setMessage(
        "Firebase is not configured yet. Use the demo dashboards below, or add keys to .env.local."
      );
      return;
    }
    setMessage("Firebase auth wiring is ready — connect signIn methods next.");
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
                : "Join as a student, helper, or both."}
            </p>
          </CardHeader>
          <CardContent>
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
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-stone-700">
                      I want to
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ["client", "Hire help"],
                          ["helper", "Help others"],
                          ["both", "Both"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          className={`rounded-xl border px-2 py-2 text-xs transition ${
                            role === value
                              ? "border-purple-600 bg-purple-50 text-purple-900"
                              : "border-purple-100 text-stone-600 hover:border-purple-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
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
                />
              </div>

              {message ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {message}
                </p>
              ) : null}

              <Button type="submit" className="w-full" size="lg">
                {mode === "login" ? "Log in" : "Sign up"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-stone-600">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    className="text-purple-700 hover:underline"
                    onClick={() => setMode("signup")}
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
                    onClick={() => setMode("login")}
                  >
                    Log in
                  </button>
                </>
              )}
            </p>

            <div className="mt-6 space-y-2 border-t border-purple-50 pt-5">
              <p className="text-center text-xs text-stone-500">
                Demo access (no auth required)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/client">
                  <Button variant="outline" className="w-full" size="sm">
                    Client demo
                  </Button>
                </Link>
                <Link href="/helper">
                  <Button variant="outline" className="w-full" size="sm">
                    Helper demo
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
