-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_pro" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "exams" ADD COLUMN "expires_at" TIMESTAMP(3);
