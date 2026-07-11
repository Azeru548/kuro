import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-purple-100/80 bg-[#faf7ff]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-700 text-sm font-semibold text-white shadow-md shadow-purple-900/20">
            K
          </span>
          <span className="font-display text-2xl tracking-wide text-purple-950 group-hover:text-purple-800">
            Kuro
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
          <a href="#how-it-works" className="hover:text-purple-800">
            How it works
          </a>
          <a href="#for-helpers" className="hover:text-purple-800">
            For helpers
          </a>
          <a href="#integrity" className="hover:text-purple-800">
            Integrity
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/auth">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/auth?mode=signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
