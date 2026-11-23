import Analytics from '@/components/dashboard/analytics';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AnalyticsPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="flex w-full flex-col gap-y-6">
      <div className="flex items-center gap-x-3">
        <Button asChild variant="outline" size="icon">
          <Link href="/app" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-cal text-3xl">Analytics</h1>
      </div>

      <Analytics linkId={id} />
    </div>
  );
}
