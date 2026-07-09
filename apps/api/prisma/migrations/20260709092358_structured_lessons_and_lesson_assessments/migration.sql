-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "lessonId" TEXT;

-- AlterTable
ALTER TABLE "CourseModule" ADD COLUMN     "deliveryMethod" TEXT,
ADD COLUMN     "resourcesRequired" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Assessment_lessonId_idx" ON "Assessment"("lessonId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
