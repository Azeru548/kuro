import { Suspense } from "react";
import { AuthForm } from "./auth-form";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="hero-glow flex min-h-screen items-center justify-center font-display text-2xl text-purple-900">
          Loading…
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
