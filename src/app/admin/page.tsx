import { AdminAccess } from '@/components/admin/admin-access';
import { AdminPanel } from '@/components/admin/admin-panel';
import { type AdminView, adminViews } from '@/components/admin/preview-data';
import { isAdminUser } from '@/lib/admin-access';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function AdminPage({
  searchParams,
}: { searchParams: Promise<{ view?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminUser(session.user.id)) {
    return (
      <AdminAccess
        signedIn={Boolean(session)}
        preview={process.env.NODE_ENV === 'development'}
      />
    );
  }
  const { view } = await searchParams;
  const initialView = adminViews.includes(view as AdminView)
    ? (view as AdminView)
    : 'overview';
  return <AdminPanel initialView={initialView} name={session.user.name} />;
}
