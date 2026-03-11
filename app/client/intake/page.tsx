import { getCurrentDbUser } from "@/lib/auth/roles";
import { getMyIntake } from "@/lib/queries/client-intake";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { IntakeStepper } from "@/components/client/intake/intake-stepper";

export const metadata: Metadata = {
  title: "Intake Questionnaire | Steadfast",
};

export default async function IntakePage() {
  const user = await getCurrentDbUser();
  if (!user.isClient) redirect("/");

  const intake = await getMyIntake(user.id);

  // No intake sent or already completed — go to dashboard
  if (!intake || intake.status === "COMPLETED") {
    redirect("/client");
  }

  return (
    <div className="mx-auto max-w-lg pb-16 pt-2">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Getting started
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Intake Questionnaire
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Help your coach understand your starting point. Takes about 2 minutes.
        </p>
      </div>

      <IntakeStepper />
    </div>
  );
}
