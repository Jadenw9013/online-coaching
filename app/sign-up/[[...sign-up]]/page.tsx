import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Link
        href="/"
        className="mb-8 flex flex-col items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
        aria-label="Steadfast home"
      >
        {/* Logo — responsive: ~80px mobile, ~96px sm, ~112px md+ */}
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28">
          <Image
            src="/brand/Steadfast_logo_pictoral.png"
            alt="Steadfast"
            fill
            priority
            className="object-contain"
          />
        </div>
      </Link>
      <SignUp />
    </div>
  );
}
