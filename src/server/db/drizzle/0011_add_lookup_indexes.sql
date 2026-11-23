CREATE INDEX IF NOT EXISTS "link_user_id_idx" ON "link" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "link_view_link_id_created_at_idx" ON "link_view" USING btree ("link_id","created_at");
CREATE INDEX IF NOT EXISTS "link_click_link_id_created_at_idx" ON "link_click" USING btree ("link_id","created_at");
CREATE INDEX IF NOT EXISTS "email_subscriber_link_id_idx" ON "email_subscriber" USING btree ("link_id");
