import { getCurrentDbUser } from "@/lib/auth/roles";
import { getDefaultTemplate } from "@/lib/queries/check-in-templates";
import Link from "next/link";
import { TemplateEditor } from "@/components/coach/check-in-template-editor";

type TemplateQuestion = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
};

export default async function CheckInFormSettingsPage() {
  const user = await getCurrentDbUser();
  const template = await getDefaultTemplate(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/coach/settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          aria-label="Back to settings"
        >
          &larr;
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Customize Check-in Form
          </h1>
          <p className="text-xs text-zinc-500">
            These questions apply to all your clients
          </p>
        </div>
      </div>

      <TemplateEditor
        templateId={template?.id ?? null}
        templateName={template?.name ?? ""}
        templateQuestions={
          template ? (template.questions as TemplateQuestion[]) : []
        }
      />
    </div>
  );
}
