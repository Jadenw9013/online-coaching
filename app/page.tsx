import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const { userId, sessionClaims } = await auth();

  if (userId) {
    const role = sessionClaims?.metadata?.role;
    if (role === "coach") {
      redirect("/coach/dashboard");
    }
    redirect("/client");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
            aria-label="Steadfast home"
          >
            {/* Nav logo — responsive: ~32px mobile, ~36px sm, ~40px md+ */}
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
              <Image
                src="/brand/Steadfast_logo_pictoral.png"
                alt=""
                fill
                priority
                className="object-contain"
              />
            </div>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:hover:bg-zinc-800"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
        {/* ── Hero ── */}
        <section className="px-4 sm:px-6 min-h-[calc(100vh-72px)] flex items-center">
          <div className="mx-auto max-w-3xl text-center">
            {/* Hero logo — responsive: ~96px mobile, ~112px sm, ~144px md, ~176px lg */}
            <div className="relative mx-auto mb-6 h-[40vh] max-h-[520px] w-[40vh] max-w-[520px]">
              <Image
                src="/brand/Steadfast_logo.png"
                alt="Steadfast"
                fill
                priority
                className="object-contain"
              />
            </div>
              <h1 className="mt-2 text-balance text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight">
                Structured coaching. <span className="text-zinc-400">Consistent results.</span>
              </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
              Steadfast connects coaches and clients with weekly check-ins,
              personalized meal plans, and structured feedback so
              nothing falls through the cracks.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="w-full rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
              >
                Create Free Account
              </Link>
              <a
                href="#how-it-works"
                className="w-full rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:hover:bg-zinc-800 sm:w-auto"
              >
                See How It Works
              </a>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-zinc-200 bg-white px-4 py-16 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Everything you need
            </h2>
            <p className="mt-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Built for real coaching workflows
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <FeatureCard
                title="Weekly Check-Ins"
                description="Clients log weight, progress photos, diet compliance, and notes each week. Coaches see everything in one place."
                icon="&#9745;"
              />
              <FeatureCard
                title="Meal Plan Editor"
                description="Build, duplicate, and publish meal plans in minutes. Clients see exactly what to eat &mdash; no confusion."
                icon="&#9783;"
              />
              <FeatureCard
                title="Coach Feedback Loop"
                description="Review check-ins, track weight trends, and message clients &mdash; all from a single review workspace."
                icon="&#8634;"
              />
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
              How it works
            </h2>
            <p className="mt-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Four steps. Every week.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <StepCard number={1} title="Coach assigns" description="Set up meal plans and macro targets for each client." />
              <StepCard number={2} title="Client follows" description="Follow the plan throughout the week with clear guidance." />
              <StepCard number={3} title="Weekly check-in" description="Client logs weight, photos, and notes every week." />
              <StepCard number={4} title="Coach reviews" description="Review progress, adjust plans, and send feedback." />
            </div>
          </div>
        </section>

        {/* ── Social Proof ── */}
        <section className="border-t border-zinc-200 bg-white px-4 py-12 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium text-zinc-500">
              Trusted by coaches and clients building lasting discipline.
            </p>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to get started?
            </h2>
            <p className="mt-3 text-base text-zinc-500">
              Create your free account and connect with your coach today.
            </p>
            <Link
              href="/sign-up"
              className="mt-6 inline-block rounded-xl bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create Free Account
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 opacity-50">
              <Image
                src="/brand/Steadfast_logo_pictoral.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Steadfast
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-zinc-400" aria-label="Footer navigation">
            <Link href="/sign-in" className="transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
              Sign In
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700" aria-hidden="true">&middot;</span>
            <span>Privacy</span>
            <span className="text-zinc-300 dark:text-zinc-700" aria-hidden="true">&middot;</span>
            <span>Terms</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-6 dark:border-zinc-700 dark:bg-zinc-800">
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
        {number}
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
