import { AdminPanel } from '@/components/admin/admin-panel';
import { type AdminView, adminViews } from '@/components/admin/preview-data';
import { notFound } from 'next/navigation';

export default async function PreviewPage({
  searchParams,
}: { searchParams: Promise<{ view?: string }> }) {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  const { view } = await searchParams;
  return (
    <AdminPanel
      demo
      initialView={
        adminViews.includes(view as AdminView)
          ? (view as AdminView)
          : 'overview'
      }
      name="Alex Morgan"
    />
  );
}
