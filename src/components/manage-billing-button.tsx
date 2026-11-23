'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { authClient } from '@/lib/auth-client';
import { getErrorMessage } from '@/lib/errors';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTransition } from 'react';

/** Opens the Polar customer portal: invoices, payment method, plan, cancel. */
export default function ManageBillingButton() {
  const [isPending, startTransition] = useTransition();

  const openPortal = () => {
    startTransition(async () => {
      try {
        await authClient.customer.portal();
      } catch (err) {
        toast({
          title: "Couldn't open billing",
          description: getErrorMessage(err),
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Button
      variant="outline"
      className="w-max gap-2 rounded-xl"
      onClick={openPortal}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4" />
      )}
      Manage billing
    </Button>
  );
}
