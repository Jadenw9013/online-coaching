export function mealPlanUpdatedEmail({
  clientName,
  weekLabel,
  viewUrl,
}: {
  clientName: string;
  weekLabel: string;
  viewUrl: string;
}) {
  const subject = `Your meal plan for ${weekLabel} has been updated`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <div style="padding:32px 24px;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#18181b;">
        Meal Plan Updated
      </h1>
      <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">
        Hi ${clientName},
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;">
        Your coach has published an updated meal plan for the week of <strong>${weekLabel}</strong>.
      </p>
      <a href="${viewUrl}" style="display:inline-block;padding:12px 24px;background-color:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        View Your Meal Plan
      </a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;font-size:12px;color:#a1a1aa;">
      Steadfast Coaching Platform
    </div>
  </div>
</body>
</html>`.trim();

  const text = `Hi ${clientName},\n\nYour coach has published an updated meal plan for the week of ${weekLabel}.\n\nView it here: ${viewUrl}\n\n— Steadfast Coaching Platform`;

  return { subject, html, text };
}
