import Link from "next/link";
import { type User } from "@prisma/client";
import { currentUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function UserSettings({ user }: { user: User }) {
  const clerk = await currentUser();

  return (
    <div className="flex w-full flex-col gap-y-6">
      <h1 className="font-cal text-3xl md:text-5xl">Settings</h1>

      <div className="flex flex-col gap-y-6 rounded-lg border border-border bg-background px-4 py-3">
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

          {user.plan === "FREE" && (
            <Button size="sm" asChild className="w-max">
              <Link href="/#pricing">Upgrade</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
