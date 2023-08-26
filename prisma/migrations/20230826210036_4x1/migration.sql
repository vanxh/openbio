/*
  Warnings:

  - The values [SIZE_1x4] on the enum `BentoSize` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BentoSize_new" AS ENUM ('SIZE_4x1', 'SIZE_2x2', 'SIZE_2x4', 'SIZE_4x2', 'SIZE_4x4');
ALTER TABLE "Bento" ALTER COLUMN "desktopSize" DROP DEFAULT;
ALTER TABLE "Bento" ALTER COLUMN "mobileSize" DROP DEFAULT;
ALTER TABLE "Bento" ALTER COLUMN "mobileSize" TYPE "BentoSize_new" USING ("mobileSize"::text::"BentoSize_new");
ALTER TABLE "Bento" ALTER COLUMN "desktopSize" TYPE "BentoSize_new" USING ("desktopSize"::text::"BentoSize_new");
ALTER TYPE "BentoSize" RENAME TO "BentoSize_old";
ALTER TYPE "BentoSize_new" RENAME TO "BentoSize";
DROP TYPE "BentoSize_old";
ALTER TABLE "Bento" ALTER COLUMN "desktopSize" SET DEFAULT 'SIZE_2x2';
ALTER TABLE "Bento" ALTER COLUMN "mobileSize" SET DEFAULT 'SIZE_2x2';
COMMIT;
