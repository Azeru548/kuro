import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpenCheck,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

const steps = [
  {
    title: "Describe your need",
    body: "Post a request with details, deadline, and the price you’re willing to pay.",
  },
  {
    title: "Bid on helpers",
    body: "Browse helper profiles and bid on up to three. Cancel anytime before they accept.",
  },
  {
    title: "Chat & collaborate",
    body: "Talk on-platform, share context, and keep everything traceable.",
  },
  {
    title: "Pay with Paystack",
    body: "When a helper accepts, checkout securely and track progress to completion.",
  },
];

const features = [
  {
    icon: Users,
    title: "Open to anyone",
    body: "Clients and helpers sign up with any email — school or personal.",
  },
  {
    icon: BookOpenCheck,
    title: "Help, not ghostwriting",
    body: "Built for tutoring, feedback, walkthroughs, and study collaboration.",
  },
  {
    icon: MessageCircle,
    title: "On-platform chat",
    body: "Message helpers without going off-app. Stay protected and organized.",
  },
  {
    icon: Wallet,
    title: "Paystack checkout",
    body: "Local-friendly payments when a match is made and work begins.",
  },
];

export default function HomePage() {
  return (
    <div className="hero-glow min-h-screen">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/70 px-3 py-1 text-xs font-medium text-purple-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Campus help marketplace
            </p>
            <h1 className="font-display text-5xl leading-tight text-purple-950 sm:text-6xl md:text-7xl">
              Learn with help.
              <span className="block italic text-purple-700">
                Not alone, not in the dark.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
              Kuro connects students who need tutoring, project feedback, and
              study support with helpers who can guide them — at a fair price,
              with progress tracking and secure Paystack payments.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth?mode=signup">
                <Button size="lg">Start as a student</Button>
              </Link>
              <Link href="/auth?mode=signup&role=helper">
                <Button size="lg" variant="outline">
                  Join as a helper
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-stone-500">
              Scaffold demo — explore dashboards without Firebase keys.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Bid on up to", value: "3 helpers" },
              { label: "Decline with", value: "clear reasons" },
              { label: "Payments via", value: "Paystack" },
            ].map((stat) => (
              <Card key={stat.label} className="bg-white/80 text-center">
                <CardContent className="py-6">
                  <p className="text-xs uppercase tracking-wider text-stone-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-display text-3xl text-purple-900">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-y border-purple-100 bg-white/60 py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center font-display text-4xl text-purple-950 sm:text-5xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-stone-600">
              From request to match in four elegant steps.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-purple-100 bg-[#faf7ff] p-5"
                >
                  <span className="font-display text-3xl text-purple-300">
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 font-display text-2xl text-purple-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="for-helpers" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-4xl text-purple-950 sm:text-5xl">
                  Built for helpers too
                </h2>
                <p className="mt-4 text-stone-600 leading-relaxed">
                  Set your minimum price and specialties. Review incoming bids
                  in your inbox. Accept what fits — or decline with a ready-made
                  reason like “amount too small” or “not my specialty.”
                </p>
                <ul className="mt-6 space-y-3 text-sm text-stone-700">
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />
                    Minimum price protects your time
                  </li>
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />
                    Template declines keep responses professional
                  </li>
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />
                    Chat stays on Kuro — less off-platform chaos
                  </li>
                </ul>
                <div className="mt-8">
                  <Link href="/helper">
                    <Button>Preview helper dashboard</Button>
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <Card key={f.title}>
                      <CardContent className="space-y-2 py-6">
                        <Icon className="h-5 w-5 text-purple-700" />
                        <h3 className="font-display text-xl text-purple-950">
                          {f.title}
                        </h3>
                        <p className="text-sm text-stone-600">{f.body}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          id="integrity"
          className="border-t border-purple-100 bg-purple-950 py-16 text-purple-50"
        >
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-display text-4xl italic sm:text-5xl">
              Academic integrity matters
            </h2>
            <p className="mt-4 text-purple-100/90 leading-relaxed">
              Kuro is for learning support — tutoring, review, and collaboration.
              Using the platform to submit someone else’s work as your own
              violates academic codes and our terms. Helpers guide; you own
              your submissions.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/client">
                <Button className="bg-white text-purple-900 hover:bg-purple-100">
                  Client dashboard
                </Button>
              </Link>
              <Link href="/helper">
                <Button
                  variant="outline"
                  className="border-purple-400 text-white hover:bg-purple-900"
                >
                  Helper dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-purple-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-stone-500 sm:flex-row sm:px-6">
          <span className="font-display text-lg text-purple-900">Kuro</span>
          <p>Campus help marketplace · Firebase · Paystack · Netlify</p>
        </div>
      </footer>
    </div>
  );
}
