-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "courseModuleId" TEXT;

-- AlterTable
ALTER TABLE "AssessmentAttempt" ADD COLUMN     "questionSnapshot" JSONB;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "courseModuleId" TEXT;

-- AlterTable
ALTER TABLE "AssignmentSubmission" ADD COLUMN     "content" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "gradingGuidance" TEXT;

-- CreateIndex
CREATE INDEX "Assessment_courseModuleId_idx" ON "Assessment"("courseModuleId");

-- CreateIndex
CREATE INDEX "Assignment_courseModuleId_idx" ON "Assignment"("courseModuleId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseModuleId_fkey" FOREIGN KEY ("courseModuleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseModuleId_fkey" FOREIGN KEY ("courseModuleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
