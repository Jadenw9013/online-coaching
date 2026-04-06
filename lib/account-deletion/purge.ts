import { db } from "@/lib/db";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Permanently purge all data for a user in FK-safe order.
 * Called by the purge cron after the 30-day grace period.
 *
 * IMPORTANT: Every delete is scoped to userId — never deletes another user's data.
 */
export async function purgeUserAccount(userId: string): Promise<void> {
  // ── 0. Load user + deletion request ──────────────────────────────────────
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkId: true,
      isCoach: true,
      isClient: true,
      profilePhotoPath: true,
    },
  });
  if (!user) throw new Error(`User ${userId} not found`);

  const request = await db.accountDeletionRequest.findUnique({
    where: { userId },
  });
  if (!request) throw new Error(`No deletion request for user ${userId}`);

  // Save clerkId on the request before we delete the user row
  if (!request.clerkId) {
    await db.accountDeletionRequest.update({
      where: { id: request.id },
      data: { clerkId: user.clerkId },
    });
  }

  // ── 1. Storage cleanup (before DB rows vanish) ───────────────────────────
  try {
    await cleanupStorage(userId, user);
    await db.accountDeletionRequest.update({
      where: { id: request.id },
      data: { storageCleanedAt: new Date() },
    });
  } catch (err) {
    console.error(`[purge] Storage cleanup failed for ${userId}:`, err);
    // Continue with DB deletion — storage can be orphaned safely
  }

  // ── 2. DB deletion in FK-safe order ──────────────────────────────────────
  // Using raw SQL for bulk deletes scoped by userId.
  // Models with onDelete: Cascade on the User FK will be cleaned up when
  // the User row is deleted, but we delete explicitly first to be safe.

  // --- Deep FK chains first (IntakePacket → CoachingRequest → CoachProfile) ---

  if (user.isCoach) {
    // DocumentSignature → IntakePacketDocument → IntakePacket → CoachingRequest
    await db.$executeRaw`
      DELETE FROM "DocumentSignature" ds
      USING "IntakePacketDocument" ipd, "IntakePacket" ip, "CoachingRequest" cr, "CoachProfile" cp
      WHERE ds."intakePacketDocumentId" = ipd."id"
        AND ipd."intakePacketId" = ip."id"
        AND ip."coachingRequestId" = cr."id"
        AND cr."coachProfileId" = cp."id"
        AND cp."userId" = ${userId}
    `;
    await db.$executeRaw`
      DELETE FROM "IntakePacketDocument" ipd
      USING "IntakePacket" ip, "CoachingRequest" cr, "CoachProfile" cp
      WHERE ipd."intakePacketId" = ip."id"
        AND ip."coachingRequestId" = cr."id"
        AND cr."coachProfileId" = cp."id"
        AND cp."userId" = ${userId}
    `;
    await db.$executeRaw`
      DELETE FROM "IntakePacket" ip
      USING "CoachingRequest" cr, "CoachProfile" cp
      WHERE ip."coachingRequestId" = cr."id"
        AND cr."coachProfileId" = cp."id"
        AND cp."userId" = ${userId}
    `;
    // ClientFormSignature → ClientFormSubmission → CoachingRequest
    await db.$executeRaw`
      DELETE FROM "ClientFormSignature" cfs
      USING "ClientFormSubmission" sub, "CoachingRequest" cr, "CoachProfile" cp
      WHERE cfs."coachingRequestId" = cr."id"
        AND cr."coachProfileId" = cp."id"
        AND cp."userId" = ${userId}
    `;
    await db.$executeRaw`
      DELETE FROM "ClientFormSubmission" sub
      USING "CoachingRequest" cr, "CoachProfile" cp
      WHERE sub."coachingRequestId" = cr."id"
        AND cr."coachProfileId" = cp."id"
        AND cp."userId" = ${userId}
    `;
    // ConsultationMeeting → CoachingRequest
    await db.$executeRaw`
      DELETE FROM "ConsultationMeeting" WHERE "coachId" = ${userId}
    `;
    // CoachingRequest (coach-owned via CoachProfile)
    await db.$executeRaw`
      DELETE FROM "CoachingRequest" cr
      USING "CoachProfile" cp
      WHERE cr."coachProfileId" = cp."id" AND cp."userId" = ${userId}
    `;
  }

  // --- Client-scoped data ---
  if (user.isClient) {
    // CheckInPhoto (cascades from CheckIn, but delete explicitly)
    await db.$executeRaw`
      DELETE FROM "CheckInPhoto" WHERE "checkInId" IN (
        SELECT "id" FROM "CheckIn" WHERE "clientId" = ${userId}
      )
    `;
    await db.$executeRaw`DELETE FROM "CheckIn" WHERE "clientId" = ${userId}`;

    // DailyMealCheckoff + ExerciseCheckoff → DailyAdherence
    await db.$executeRaw`
      DELETE FROM "DailyMealCheckoff" WHERE "dailyAdherenceId" IN (
        SELECT "id" FROM "DailyAdherence" WHERE "clientId" = ${userId}
      )
    `;
    await db.$executeRaw`
      DELETE FROM "ExerciseCheckoff" WHERE "dailyAdherenceId" IN (
        SELECT "id" FROM "DailyAdherence" WHERE "clientId" = ${userId}
      )
    `;
    await db.$executeRaw`DELETE FROM "DailyAdherence" WHERE "clientId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "ExerciseResult" WHERE "clientId" = ${userId}`;

    // TrainingProgram chain (client-assigned programs)
    await db.$executeRaw`
      DELETE FROM "TrainingExercise" WHERE "dayId" IN (
        SELECT td."id" FROM "TrainingDay" td
        JOIN "TrainingProgram" tp ON td."programId" = tp."id"
        WHERE tp."clientId" = ${userId}
      )
    `;
    await db.$executeRaw`
      DELETE FROM "TrainingProgramBlock" WHERE "dayId" IN (
        SELECT td."id" FROM "TrainingDay" td
        JOIN "TrainingProgram" tp ON td."programId" = tp."id"
        WHERE tp."clientId" = ${userId}
      )
    `;
    await db.$executeRaw`
      DELETE FROM "TrainingProgramCardio" WHERE "programId" IN (
        SELECT "id" FROM "TrainingProgram" WHERE "clientId" = ${userId}
      )
    `;
    await db.$executeRaw`
      DELETE FROM "TrainingDay" WHERE "programId" IN (
        SELECT "id" FROM "TrainingProgram" WHERE "clientId" = ${userId}
      )
    `;
    await db.$executeRaw`DELETE FROM "TrainingProgram" WHERE "clientId" = ${userId}`;

    // MealPlan chain (client's plans — coach-authored but assigned to client)
    await db.$executeRaw`
      DELETE FROM "MealPlanItem" WHERE "mealPlanId" IN (
        SELECT "id" FROM "MealPlan" WHERE "clientId" = ${userId}
      )
    `;
    await db.$executeRaw`DELETE FROM "MealPlan" WHERE "clientId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "MacroTarget" WHERE "clientId" = ${userId}`;

    // Onboarding + Intake
    await db.$executeRaw`DELETE FROM "OnboardingResponse" WHERE "clientId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "ClientIntake" WHERE "clientId" = ${userId}`;

    // CoachingRequest (as prospect)
    await db.$executeRaw`
      UPDATE "CoachingRequest" SET "prospectId" = NULL WHERE "prospectId" = ${userId}
    `;
  }

  // --- Coach-specific data ---
  if (user.isCoach) {
    // Training templates chain
    await db.$executeRaw`
      DELETE FROM "TrainingTemplateExercise" WHERE "dayId" IN (
        SELECT td."id" FROM "TrainingTemplateDay" td
        JOIN "TrainingTemplate" tt ON td."templateId" = tt."id"
        WHERE tt."coachId" = ${userId}
      )
    `;
    await db.$executeRaw`
      DELETE FROM "TrainingTemplateBlock" WHERE "dayId" IN (
        SELECT td."id" FROM "TrainingTemplateDay" td
        JOIN "TrainingTemplate" tt ON td."templateId" = tt."id"
        WHERE tt."coachId" = ${userId}
      )
    `;
    await db.$executeRaw`
      DELETE FROM "TrainingTemplateCardio" WHERE "templateId" IN (
        SELECT "id" FROM "TrainingTemplate" WHERE "coachId" = ${userId}
      )
    `;
    await db.$executeRaw`
      DELETE FROM "TrainingTemplateDay" WHERE "templateId" IN (
        SELECT "id" FROM "TrainingTemplate" WHERE "coachId" = ${userId}
      )
    `;
    // Nullify templateSourceId on programs before deleting templates
    await db.$executeRaw`
      UPDATE "TrainingProgram" SET "templateSourceId" = NULL
      WHERE "templateSourceId" IN (
        SELECT "id" FROM "TrainingTemplate" WHERE "coachId" = ${userId}
      )
    `;
    await db.$executeRaw`DELETE FROM "TrainingTemplate" WHERE "coachId" = ${userId}`;

    // Coach file-based models
    await db.$executeRaw`DELETE FROM "MealPlanDraft" WHERE "coachId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "MealPlanUpload" WHERE "coachId" = ${userId}`;
    await db.$executeRaw`
      DELETE FROM "WorkoutImportDraft" WHERE "importId" IN (
        SELECT "id" FROM "WorkoutImport" WHERE "coachId" = ${userId}
      )
    `;
    await db.$executeRaw`DELETE FROM "WorkoutImport" WHERE "coachId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "PlanSnippet" WHERE "coachId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "CheckInTemplate" WHERE "coachId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "FoodLibraryItem" WHERE "coachId" = ${userId}`;

    // Coach documents (before IntakePacketDocument references are gone)
    await db.$executeRaw`DELETE FROM "CoachDocument" WHERE "coachId" = ${userId}`;

    await db.$executeRaw`DELETE FROM "OnboardingForm" WHERE "coachId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "ClientInvite" WHERE "coachId" = ${userId}`;
    await db.$executeRaw`DELETE FROM "ClientIntake" WHERE "coachId" = ${userId}`;
  }

  // --- Shared models (both roles) ---
  await db.$executeRaw`DELETE FROM "Message" WHERE "senderId" = ${userId}`;
  await db.$executeRaw`DELETE FROM "NotificationLog" WHERE "clientId" = ${userId}`;
  await db.$executeRaw`DELETE FROM "Testimonial" WHERE "coachId" = ${userId} OR "clientId" = ${userId}`;
  await db.$executeRaw`DELETE FROM "CoachClient" WHERE "coachId" = ${userId} OR "clientId" = ${userId}`;
  await db.$executeRaw`DELETE FROM "MealPlanUpload" WHERE "clientId" = ${userId}`;

  // Coach marketplace (cascade: PortfolioItem, SavedCoach)
  if (user.isCoach) {
    await db.$executeRaw`
      DELETE FROM "PortfolioItem" WHERE "coachProfileId" IN (
        SELECT "id" FROM "CoachProfile" WHERE "userId" = ${userId}
      )
    `;
    await db.$executeRaw`
      DELETE FROM "SavedCoach" WHERE "coachProfileId" IN (
        SELECT "id" FROM "CoachProfile" WHERE "userId" = ${userId}
      )
    `;
    await db.$executeRaw`DELETE FROM "CoachProfile" WHERE "userId" = ${userId}`;
  }
  // SavedCoach (as the user who saved)
  await db.$executeRaw`DELETE FROM "SavedCoach" WHERE "userId" = ${userId}`;

  // CoachSettings, IntakeFormTemplate (have onDelete: Cascade, but be explicit)
  await db.$executeRaw`DELETE FROM "CoachSettings" WHERE "coachId" = ${userId}`;
  await db.$executeRaw`DELETE FROM "IntakeFormTemplate" WHERE "coachId" = ${userId}`;

  // Team: just unlink, don't delete the team
  await db.$executeRaw`UPDATE "User" SET "team_id" = NULL, "team_role" = NULL WHERE "id" = ${userId}`;

  // ── 3. Delete User row ───────────────────────────────────────────────────
  // AccountDeletionRequest FK has onDelete: RESTRICT — temporarily drop it
  await db.$executeRaw`
    ALTER TABLE "AccountDeletionRequest" DROP CONSTRAINT IF EXISTS "AccountDeletionRequest_userId_fkey"
  `;
  await db.$executeRaw`DELETE FROM "User" WHERE "id" = ${userId}`;
  // Re-add constraint for other users' requests
  await db.$executeRaw`
    ALTER TABLE "AccountDeletionRequest"
    ADD CONSTRAINT "AccountDeletionRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
    NOT VALID
  `.catch(() => {
    // Non-fatal: constraint may fail if userId column has orphaned refs
    console.warn("[purge] Could not re-add AccountDeletionRequest FK constraint");
  });

  // ── 4. Clerk deletion ────────────────────────────────────────────────────
  const clerkId = request.clerkId || user.clerkId;
  if (clerkId) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const clerk = await clerkClient();
      await clerk.users.deleteUser(clerkId);
      await db.accountDeletionRequest.update({
        where: { id: request.id },
        data: { clerkDeletedAt: new Date() },
      });
    } catch (err) {
      console.error(`[purge] Clerk deletion failed for ${clerkId}:`, err);
      // Non-fatal: Clerk user can be manually cleaned up
    }
  }

  // ── 5. Finalize ──────────────────────────────────────────────────────────
  await db.accountDeletionRequest.update({
    where: { id: request.id },
    data: { status: "COMPLETED", purgeCompletedAt: new Date() },
  });
}

// ── Storage cleanup helper ─────────────────────────────────────────────────

async function cleanupStorage(
  userId: string,
  user: { profilePhotoPath: string | null; isCoach: boolean; isClient: boolean }
) {
  const supabase = createServiceClient();

  // Profile photo
  if (user.profilePhotoPath) {
    await supabase.storage.from("profile-photos").remove([user.profilePhotoPath]).catch(() => {});
  }

  // Check-in photos
  if (user.isClient) {
    const checkIns = await db.checkIn.findMany({
      where: { clientId: userId },
      select: { id: true },
    });
    for (const ci of checkIns) {
      const { data: files } = await supabase.storage
        .from("check-in-photos")
        .list(ci.id);
      if (files && files.length > 0) {
        await supabase.storage
          .from("check-in-photos")
          .remove(files.map((f) => `${ci.id}/${f.name}`));
      }
    }
  }

  // Coach storage buckets
  if (user.isCoach) {
    // Portfolio media
    const portfolioItems = await db.$queryRaw<Array<{ mediaPath: string }>>`
      SELECT pi."mediaPath" FROM "PortfolioItem" pi
      JOIN "CoachProfile" cp ON pi."coachProfileId" = cp."id"
      WHERE cp."userId" = ${userId} AND pi."mediaPath" IS NOT NULL
    `;
    if (portfolioItems.length > 0) {
      await supabase.storage
        .from("portfolio-media")
        .remove(portfolioItems.map((p) => p.mediaPath))
        .catch(() => {});
    }

    // Testimonial images
    const testimonials = await db.$queryRaw<Array<{ images: string[] }>>`
      SELECT "images" FROM "Testimonial" WHERE "coachId" = ${userId}
    `;
    const allImages = testimonials.flatMap((t) => t.images).filter(Boolean);
    if (allImages.length > 0) {
      await supabase.storage
        .from("testimonial-images")
        .remove(allImages)
        .catch(() => {});
    }

    // Meal plan uploads
    const uploads = await db.mealPlanUpload.findMany({
      where: { coachId: userId },
      select: { storageBucket: true, storagePath: true },
    });
    for (const u of uploads) {
      await supabase.storage.from(u.storageBucket).remove([u.storagePath]).catch(() => {});
    }

    // Coach documents
    const docs = await db.coachDocument.findMany({
      where: { coachId: userId },
      select: { filePath: true },
    });
    const docPaths = docs.map((d) => d.filePath).filter(Boolean) as string[];
    if (docPaths.length > 0) {
      await supabase.storage.from("coach-documents").remove(docPaths).catch(() => {});
    }
  }
}
