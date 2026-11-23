/**
 * Largest image upload accepted, shared by the browser (to fail fast with a
 * useful message) and the upload routes. Vercel rejects request bodies over
 * 4.5 MB before they reach a route handler, so this stays under that.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const MAX_UPLOAD_LABEL = '4 MB';
