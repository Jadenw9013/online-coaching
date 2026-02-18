import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { NavBar } from "@/components/ui/nav-bar";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentDbUser();

  if (user.activeRole !== "CLIENT") {
    redirect("/coach/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b]">
      <NavBar
        role="client"
        canSwitchRole={user.isCoach && user.isClient}
      />
      <main id="main-content" className="mx-auto max-w-5xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
