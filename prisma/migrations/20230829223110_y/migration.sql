-- DropIndex
DROP INDEX "ProfileLinkView_ip_key";

-- CreateIndex
CREATE INDEX "ProfileLinkView_ip_idx" ON "ProfileLinkView"("ip");
