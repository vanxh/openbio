import { isOptimizable } from '@/lib/image-host';
import Image, { type ImageProps } from 'next/image';

/**
 * `next/image` for sources that may live anywhere: link previews, album art,
 * avatars, map tiles, legacy uploads. Images we host are optimized as usual;
 * anything else is loaded straight from its own server, like a plain `<img>`.
 *
 * Use this instead of `next/image` whenever `src` is not a static import.
 * Passing an unlisted host to `next/image` directly throws at render.
 */
export default function RemoteImage({ unoptimized, ...props }: ImageProps) {
  const fromElsewhere =
    typeof props.src === 'string' && !isOptimizable(props.src);

  return <Image {...props} unoptimized={unoptimized ?? fromElsewhere} />;
}
