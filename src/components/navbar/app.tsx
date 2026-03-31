'use client';

import { UserMenu } from '@/components/dashboard/user-menu';
import { NavbarShell } from '@/components/navbar/shared';

export default function AppNavbar() {
  return (
    <NavbarShell>
      <UserMenu />
    </NavbarShell>
  );
}
