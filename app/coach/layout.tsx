import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { NavBar } from "@/components/ui/nav-bar";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentDbUser();

  if (user.activeRole !== "COACH") {
    redirect("/client");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar
        role="coach"
        canSwitchRole={user.isCoach && user.isClient}
      />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
