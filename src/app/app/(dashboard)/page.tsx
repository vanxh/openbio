import Link from "next/link";
import ProfileLinkCard from "@/components/profile-link-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserSettings from "@/components/user-settings";
import { api } from "@/trpc/server";

export default async function Page() {
  const links = await api.profileLink.getAll.query();

  const user = await api.user.me.query();

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col items-center">
      <Tabs defaultValue="links" className="flex w-full flex-col items-center">
        <TabsList className="w-max">
          <TabsTrigger value="links">OpenBio Links</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="mt-4 w-full">
          <div className="flex flex-col gap-y-8">
            <div className="flex w-full items-center justify-between">
              <h1 className="font-cal text-3xl md:text-5xl">My Links</h1>

              <Link href="/claim-link" passHref>
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

                <Button className="mt-4" asChild>
                  <Link href="/claim-link">Create Link</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 w-full">
          <UserSettings user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
