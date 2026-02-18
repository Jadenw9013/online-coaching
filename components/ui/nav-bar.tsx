import { SignedIn, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { RoleSwitcher } from "./role-switcher";

export function NavBar({
  role,
  canSwitchRole,
}: {
  role: "coach" | "client";
  canSwitchRole?: boolean;
}) {
  const maxWidth = role === "coach" ? "max-w-7xl" : "max-w-5xl";
  const homeHref = role === "coach" ? "/coach/dashboard" : "/client";

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/90 backdrop-blur-md dark:border-zinc-800/60 dark:bg-[#09090b]/90">
      <div className={`mx-auto flex h-16 ${maxWidth} items-center justify-between px-5 sm:px-8`}>
        <Link
          href={homeHref}
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
          aria-label="Steadfast home"
        >
          <div className="relative h-8 w-8 sm:h-9 sm:w-9">
            <Image
              src="/brand/Steadfast_logo_pictoral.png"
              alt=""
              fill
              priority
              className="object-contain"
            />
          </div>
        </Link>
        <nav className="flex items-center gap-3" aria-label="Main navigation">
          {canSwitchRole && <RoleSwitcher currentRole={role} />}
          {role === "client" && (
            <Link
              href="/client/check-in"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <span className="hidden sm:inline">New Check-In</span>
              <span className="sm:hidden">Check-In</span>
            </Link>
          )}
          <SignedIn>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
