/*
  Warnings:

  - You are about to drop the column `desktopPosition` on the `Bento` table. All the data in the column will be lost.
  - You are about to drop the column `desktopSize` on the `Bento` table. All the data in the column will be lost.
  - You are about to drop the column `mobilePosition` on the `Bento` table. All the data in the column will be lost.
  - You are about to drop the column `mobileSize` on the `Bento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bento" DROP COLUMN "desktopPosition",
DROP COLUMN "desktopSize",
DROP COLUMN "mobilePosition",
DROP COLUMN "mobileSize",
ADD COLUMN     "position" JSONB NOT NULL DEFAULT '{"x":0,"y":0}',
ADD COLUMN     "size" "BentoSize" NOT NULL DEFAULT 'SIZE_2x2';
