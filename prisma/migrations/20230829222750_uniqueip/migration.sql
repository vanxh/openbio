/*
  Warnings:

  - A unique constraint covering the columns `[ip]` on the table `ProfileLinkView` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProfileLinkView_ip_idx";

-- CreateIndex
CREATE UNIQUE INDEX "ProfileLinkView_ip_key" ON "ProfileLinkView"("ip");
