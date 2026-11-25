-- CreateTable
CREATE TABLE "PinImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pinId" TEXT NOT NULL,

    CONSTRAINT "PinImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PinImage_pinId_sortOrder_idx" ON "PinImage"("pinId", "sortOrder");

-- AddForeignKey
ALTER TABLE "PinImage" ADD CONSTRAINT "PinImage_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
