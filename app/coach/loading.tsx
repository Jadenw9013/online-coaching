import Image from "next/image";

export default function CoachLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Logo — responsive: ~80px mobile, ~96px tablet, ~112px desktop */}
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28">
          <Image
            src="/brand/Steadfast_logo_pictoral.png"
            alt=""
            fill
            priority
            className="object-contain animate-splash-pulse"
          />
        </div>
        <span className="text-xs text-zinc-400">Loading...</span>
      </div>
    </div>
  );
}
