const TAG_RE = /<[^>]*>/g;
const BLOCK_BREAK_RE = /<\/(?:p|div|h[1-6]|li|blockquote)>|<br\s*\/?>/gi;
const WHITESPACE_RE = /\s+/g;
const ENTITY_RE = /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntity(match: string, body: string): string {
  const lower = body.toLowerCase();
  if (lower.startsWith('#')) {
    const code = lower.startsWith('#x')
      ? Number.parseInt(lower.slice(2), 16)
      : Number.parseInt(lower.slice(1), 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10_ff_ff
      ? String.fromCodePoint(code)
      : match;
  }
  return NAMED_ENTITIES[lower] ?? match;
}

/**
 * Plain text for rich-text HTML (a bio, a note): tags removed, block
 * boundaries kept as spaces so paragraphs do not run together, and entities
 * decoded so "Design &amp; code" reads "Design & code".
 *
 * The result is text, not sanitised HTML: render it as a text node only.
 */
export function htmlToText(html: string): string {
  return html
    .replace(BLOCK_BREAK_RE, ' ')
    .replace(TAG_RE, '')
    .replace(ENTITY_RE, decodeEntity)
    .replace(WHITESPACE_RE, ' ')
    .trim();
}

const JSON_LD_UNSAFE_RE = /[<>&\u2028\u2029]/g;

/**
 * Serialise data for an inline `<script type="application/ld+json">`.
 *
 * `JSON.stringify` leaves `<` alone, so a profile named `</script><script>…`
 * would close the element and run as markup. Escaping those characters as
 * `\uXXXX` keeps the JSON identical once parsed and inert inside HTML.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(
    JSON_LD_UNSAFE_RE,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
}
