/*
  Warnings:

  - You are about to drop the column `views` on the `ProfileLink` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProfileLink" DROP COLUMN "views";

-- CreateTable
CREATE TABLE "ProfileLinkView" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileLinkId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "ProfileLinkView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileLinkView_profileLinkId_ip_idx" ON "ProfileLinkView"("profileLinkId", "ip");

-- CreateIndex
CREATE INDEX "ProfileLinkView_ip_idx" ON "ProfileLinkView"("ip");

-- AddForeignKey
ALTER TABLE "ProfileLinkView" ADD CONSTRAINT "ProfileLinkView_profileLinkId_fkey" FOREIGN KEY ("profileLinkId") REFERENCES "ProfileLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
