"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { type TRPCError } from "@trpc/server";
import * as z from "zod";
import {
  AtSign,
  Github,
  Instagram,
  Linkedin,
  Twitch,
  Twitter,
  Youtube,
} from "lucide-react";
import { BiLogoTelegram } from "react-icons/bi";
import { BsDiscord } from "react-icons/bs";

import { api } from "@/trpc/client";
import { useZodForm } from "@/hooks/use-zod-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";

const setupLinkSchema = z.object({
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  youtube: z.string().optional(),
  twitch: z.string().optional(),
});

const socials = [
  {
    name: "Twitter",
    icon: Twitter,
    placeholder: "vanxhh",
    key: "twitter",
  },
  {
    name: "Github",
    icon: Github,
    placeholder: "vanxh",
    key: "github",
  },
  {
    name: "Linkedin",
    icon: Linkedin,
    placeholder: "vanxhh",
    key: "linkedin",
  },
  {
    name: "Instagram",
    icon: Instagram,
    placeholder: "vanxh.dev",
    key: "instagram",
  },
  {
    name: "Telegram",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: BiLogoTelegram,
    placeholder: "vanxhh",
    key: "telegram",
  },
  {
    name: "Discord",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: BsDiscord,
    placeholder: "vanxh",
    key: "discord",
  },
  {
    name: "Youtube",
    icon: Youtube,
    placeholder: "username",
    key: "youtube",
  },
  {
    name: "Twitch",
    icon: Twitch,
    placeholder: "username",
    key: "twitch",
  },
];

export default function SetupLink() {
  const searchParams = useSearchParams();
  const link = searchParams.get("link")!;

  const router = useRouter();

  const form = useZodForm({
    schema: setupLinkSchema,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await api.profileLink.create.mutate({
        link,
        ...data,
      });

      void router.push(`/${link}`);
    } catch (e) {
      toast({
        title: "Error",
        description: (e as TRPCError).message,
      });
    }
  });

  return (
    <Form {...form}>
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form onSubmit={onSubmit} className="w-full space-y-8 md:w-[350px]">
        {socials.map((social) => (
          <FormField
            key={social.key}
            control={form.control}
            name={social.key as keyof z.infer<typeof setupLinkSchema>}
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-row items-center gap-x-2">
                  <div className="inline-flex h-9 w-9 min-w-[36px] items-center justify-center rounded-md bg-primary text-primary-foreground shadow">
                    <social.icon className="h-[1.2rem] w-[1.2rem]" />
                  </div>

                  <div className="flex h-9 w-full items-center gap-x-1 rounded-md border border-input px-3 py-1 text-sm shadow-sm">
                    <AtSign className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
                    <FormControl>
                      <input
                        className="bg-transparent outline-none placeholder:text-muted-foreground"
                        placeholder={social.placeholder}
                        {...field}
                      />
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button type="submit">Next</Button>
      </form>
    </Form>
  );
}
