import { CheckInForm } from "@/components/check-in/check-in-form";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { getLatestCheckIn } from "@/lib/queries/check-ins";
import { getActiveTemplateForClient } from "@/lib/queries/check-in-templates";

type TemplateQuestion = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
};

export default async function ClientCheckInPage() {
  const user = await getCurrentDbUser();
  const [latest, template] = await Promise.all([
    getLatestCheckIn(user.id),
    getActiveTemplateForClient(user.id),
  ]);

  const templateQuestions = template
    ? (template.questions as TemplateQuestion[])
    : undefined;

  return (
    <div className="mx-auto max-w-lg">
      {/* Page header */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/70">Weekly Update</p>
        <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white">Check-In</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Your coach reviews every submission</p>
      </div>

      <CheckInForm
        previousWeight={
          latest?.weight
            ? {
              weight: latest.weight,
              date: latest.submittedAt.toISOString(),
            }
            : null
        }
        templateId={template?.id}
        templateQuestions={templateQuestions}
      />
    </div>
  );
}
