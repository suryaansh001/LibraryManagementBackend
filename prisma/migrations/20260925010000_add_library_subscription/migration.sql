-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAYMENT_PENDING', 'SUSPENDED');

-- AlterTable
ALTER TABLE "libraries"
ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "paymentDueAt" TIMESTAMP(3),
ADD COLUMN "suspendedAt" TIMESTAMP(3);

-- Existing tenants receive a short transition window before billing is required.
UPDATE "libraries" SET "trialEndsAt" = NOW() + INTERVAL '14 days' WHERE "trialEndsAt" IS NULL;