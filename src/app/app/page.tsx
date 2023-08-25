import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HomeIcon from "@/components/home-icon";

export default function Page() {
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

        <TabsContent value="links" className="w-full">
          <div className="flex w-full items-center justify-between">
            <h1 className="font-cal text-3xl md:text-5xl">My Links</h1>

            <Link href="/claim" passHref>
              <Button>Create Link</Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="w-full">
          <div className="flex w-full flex-col">
            <h1 className="font-cal text-3xl md:text-5xl">Settings</h1>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
