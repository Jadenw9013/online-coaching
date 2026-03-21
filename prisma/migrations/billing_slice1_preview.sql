-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('BETA', 'STARTER', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "BillingState" AS ENUM ('BETA', 'GRACE_PERIOD', 'REQUIRES_PAYMENT', 'ACTIVE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "betaAccessEndsAt" TIMESTAMP(3),
ADD COLUMN     "billingState" "BillingState",
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus",
ADD COLUMN     "subscriptionTier" "SubscriptionTier";

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
