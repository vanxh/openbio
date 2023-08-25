/*
  Warnings:

  - You are about to drop the column `position` on the `Bento` table. All the data in the column will be lost.
  - You are about to drop the column `style` on the `Bento` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BentoSize" AS ENUM ('SIZE_2x2', 'SIZE_2x4', 'SIZE_4x2', 'SIZE_4x4');

-- AlterTable
ALTER TABLE "Bento" DROP COLUMN "position",
DROP COLUMN "style",
ADD COLUMN     "desktopPosition" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "desktopSize" "BentoSize" NOT NULL DEFAULT 'SIZE_2x2',
ADD COLUMN     "mobilePosition" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "mobileSize" "BentoSize" NOT NULL DEFAULT 'SIZE_2x2';
