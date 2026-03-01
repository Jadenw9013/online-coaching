import { redirect } from "next/navigation";

/** Legacy per-client URL — redirect to coach-wide settings. */
export default async function CheckInTemplatePage() {
  redirect("/coach/settings/check-in-form");
}
