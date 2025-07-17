-- AlterTable
ALTER TABLE "time_off_requests" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "isAdminCreated" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
