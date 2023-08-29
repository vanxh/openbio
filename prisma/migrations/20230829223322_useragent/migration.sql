/*
  Warnings:

  - Added the required column `userAgent` to the `ProfileLinkView` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProfileLinkView" ADD COLUMN     "userAgent" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ProfileLinkView_userAgent_idx" ON "ProfileLinkView"("userAgent");
