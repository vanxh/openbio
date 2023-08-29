"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateLinkBentoModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [link, setLink] = useState("");

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Link Card</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-y-4">
          <Input
            placeholder="Enter link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />

          <Button>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
