/*
  Warnings:

  - You are about to drop the column `position` on the `Bento` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Bento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bento" DROP COLUMN "position",
DROP COLUMN "size",
ADD COLUMN     "desktopPosition" JSONB NOT NULL DEFAULT '{"x":0,"y":0}',
ADD COLUMN     "desktopSize" "BentoSize" NOT NULL DEFAULT 'SIZE_2x2',
ADD COLUMN     "mobilePosition" JSONB NOT NULL DEFAULT '{"x":0,"y":0}',
ADD COLUMN     "mobileSize" "BentoSize" NOT NULL DEFAULT 'SIZE_2x2';
