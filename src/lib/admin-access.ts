/** Server-side allowlist. Never use email or client-provided roles for authorization. */
export function isAdminUser(userId: string | undefined): boolean {
  if (!userId) {
    return false;
  }
  return (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId);
}
