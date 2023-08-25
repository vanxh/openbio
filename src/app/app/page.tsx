import Link from "next/link";

import { api } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HomeIcon from "@/components/home-icon";
import { Eye } from "lucide-react";

export default async function Page() {
  const links = await api.profileLink.getProfileLinks.query();

  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col items-center pt-[100px]">
      <HomeIcon />

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
                <Link
                  key={link.id}
                  href={`/${link.link}`}
                  className="flex flex-col rounded-md border border-border bg-background px-4 py-2 transition-transform active:scale-95"
                >
                  <span className="font-cal text-lg">{link.name}</span>
                  <span className="text-sm text-muted-foreground">
                    openbio.app/{link.link}
                  </span>

                  <div className="mt-4 flex items-center gap-x-4 text-muted-foreground">
                    <span className="inline-flex items-center gap-x-2">
                      <Eye size={16} />
                      <span className="text-xs">
                        {link.views || "0"}{" "}
                        {link.views === 1 ? "view" : "views"}
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
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
