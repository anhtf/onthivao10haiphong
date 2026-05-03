-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('STUDENT', 'TEACHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "user_type" "UserType" NOT NULL DEFAULT 'STUDENT';
ALTER TABLE "users" ADD COLUMN "date_of_birth" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "hometown" TEXT;
ALTER TABLE "users" ADD COLUMN "school_name" TEXT;
