-- AlterTable
ALTER TABLE "Pin" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'APPROVED';

-- CreateIndex
CREATE INDEX "Pin_status_createdAt_idx" ON "Pin"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Pin_userId_status_idx" ON "Pin"("userId", "status");
