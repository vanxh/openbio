import Link from "next/link";

import { api } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileLinkCard from "@/components/profile-link-card";

export default async function Page() {
  const links = await api.profileLink.getProfileLinks.query();

  return (
    <div className="flex h-full w-full flex-col items-center">
      <Tabs defaultValue="links" className="flex w-full flex-col items-center">
        <TabsList className="w-max">
          <TabsTrigger value="links">OpenBio Links</TabsTrigger>
          <TabsTrigger value="settings" disabled>
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="mt-4 w-full">
          <div className="flex flex-col gap-y-8">
            <div className="flex w-full items-center justify-between">
              <h1 className="font-cal text-3xl md:text-5xl">My Links</h1>

              <Link href="/claim" passHref>
                <Button>Create Link</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <ProfileLinkCard key={link.id} link={link} />
              ))}
            </div>

            {!links.length && (
              <div className="flex w-full flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any links yet.
                </p>

                <Link href="/claim" passHref>
                  <Button className="mt-4">Create Link</Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 w-full">
          <div className="flex w-full flex-col">
            <h1 className="font-cal text-3xl md:text-5xl">Settings</h1>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
