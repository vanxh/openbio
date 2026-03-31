import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: "default" | "sm" | "lg";
}

export function GradientButton({
  className,
  asChild,
  size = "default",
  ...props
}: GradientButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-pink-500 font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "px-4 py-2 text-sm",
        size === "default" && "px-6 py-3 text-base",
        size === "lg" && "px-8 py-4 text-lg",
        className,
      )}
      {...props}
    />
  );
}
