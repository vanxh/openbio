type ZodErrorShape = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

const FALLBACK = 'Something went wrong. Please try again.';

/**
 * A message fit to show someone for a failed request.
 *
 * When input validation fails, tRPC's `message` is the raw list of Zod issues
 * as JSON. The API attaches the flattened issues as `data.zodError` (see
 * `errorFormatter` in `server/api/trpc.ts`), so prefer the first of those.
 */
export function getErrorMessage(error: unknown, fallback = FALLBACK): string {
  const data = (
    error as {
      data?: { code?: string; zodError?: ZodErrorShape | null };
    } | null
  )?.data;

  // Thrown without a message, so tRPC's text would be the bare code.
  if (data?.code === 'UNAUTHORIZED') {
    return 'Your session has expired. Please sign in again.';
  }

  const zodError = data?.zodError;

  if (zodError) {
    const fieldMessages = Object.values(zodError.fieldErrors ?? {}).flat();
    return zodError.formErrors?.[0] ?? fieldMessages.find(Boolean) ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
