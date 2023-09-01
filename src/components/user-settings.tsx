import { type User } from "@prisma/client";
import { currentUser } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingCards } from "@/components/pricing";

export default async function UserSettings({ user }: { user: User }) {
  const clerk = await currentUser();

  return (
    <div className="flex w-full flex-col gap-y-6">
      <h1 className="font-cal text-3xl md:text-5xl">Settings</h1>

      <div className="flex flex-col gap-y-6 rounded-lg border border-border bg-background px-4 py-4 md:px-6 md:py-6">
        <div className="space-y-2">
          <Label>Your Avatar</Label>

          <Avatar>
            <AvatarImage src={clerk?.imageUrl} />
            <AvatarFallback className="uppercase">
              {user.firstName.charAt(0)}
              {user.lastName?.split("").pop()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-2">
          <Label>Your Email</Label>

          <Input value={user.email} readOnly className="w-max" />
        </div>

        <div className="space-y-2">
          <Label>Your Name</Label>

          <Input
            value={user.firstName + " " + user.lastName}
            readOnly
            className="w-max"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <Label>Plan</Label>

          <span className="text-sm">
            You are currently subscribed to the{" "}
            <Badge className="mr-1 lowercase">{user.plan}</Badge>
            plan.
          </span>

          <Tabs
            defaultValue="monthly"
            className="mt-8 flex w-full flex-col items-center"
          >
            <TabsList className="w-full md:mr-auto md:w-max">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annually" className="gap-x-2">
                Annually
                <Badge>2 months free</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="mt-4 w-full">
              <PricingCards billing="monthly" user={user} />
            </TabsContent>

            <TabsContent value="annually" className="mt-4 w-full">
              <PricingCards billing="annually" user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
