import { GradientButton } from "@/components/ui/gradient-button";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Sparkles className="h-8 w-8 text-foreground" />
      </div>
      <h3 className="font-cal text-xl">No pages yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Create your first link-in-bio page</p>
      <Link href="/claim-link" className="mt-6">
        <GradientButton>Create your page</GradientButton>
      </Link>
    </div>
  );
}
