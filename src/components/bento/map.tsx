'use client';

import CardOverlay from '@/components/bento/overlay';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { MapBentoSchema } from '@/types';
import { Locate, MapPin, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof MapBentoSchema>;

export const MAP_CARD_SIZES = ['2x2', '4x2', '4x4'] as const;

function getTiles(lat: number, lng: number) {
  const zoom = 15;
  const xFloat = ((lng + 180) / 360) * 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  const yFloat =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    2 ** zoom;

  const cx = Math.floor(xFloat);
  const cy = Math.floor(yFloat);

  const tiles: { url: string; dx: number; dy: number }[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push({
        url: `https://a.basemaps.cartocdn.com/dark_all/${zoom}/${cx + dx}/${cy + dy}@2x.png`,
        dx,
        dy,
      });
    }
  }

  return {
    tiles,
    offsetX: (xFloat - cx) * 256,
    offsetY: (yFloat - cy) * 256,
  };
}

function AvatarPin({
  image,
  name,
}: {
  image?: string | null;
  name?: string;
}) {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className="-translate-x-1/2 -translate-y-full absolute top-1/2 left-1/2 z-10">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          {image ? (
            <Image
              src={image}
              alt={name ?? 'Avatar'}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-cal text-sm text-white">{initial}</span>
          )}
        </div>
        {/* Pin tail */}
        <div
          className="-mt-px h-0 w-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '8px solid white',
          }}
        />
      </div>
    </div>
  );
}

function MapDisplay({
  latitude,
  longitude,
  label,
  compact,
  profileImage,
  profileName,
}: {
  latitude: number;
  longitude: number;
  label?: string;
  compact?: boolean;
  profileImage?: string | null;
  profileName?: string;
}) {
  const { tiles, offsetX, offsetY } = getTiles(latitude, longitude);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a1a2e]">
      {/* Tile grid */}
      <div
        className="absolute"
        style={{
          width: 256 * 3,
          height: 256 * 3,
          left: `calc(50% - ${offsetX + 256}px)`,
          top: `calc(50% - ${offsetY + 256}px)`,
        }}
      >
        {tiles.map((tile) => (
          <Image
            key={`${tile.dx}-${tile.dy}`}
            src={tile.url}
            alt=""
            width={256}
            height={256}
            className="absolute"
            style={{
              left: (tile.dx + 1) * 256,
              top: (tile.dy + 1) * 256,
            }}
            unoptimized
            draggable={false}
          />
        ))}
      </div>

      {/* Avatar pin */}
      <AvatarPin image={profileImage} name={profileName} />

      {/* Glow */}
      <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-5">
        <div className="h-16 w-16 rounded-full bg-blue-500/20 blur-xl" />
      </div>

      {/* Label */}
      {label && !compact && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/80 via-black/40 to-transparent px-4 pt-8 pb-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-400" />
            <p className="font-medium text-sm text-white">{label}</p>
          </div>
        </div>
      )}

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]" />
    </div>
  );
}

function EmptyMapState({ editable }: { editable?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#1a1a2e]">
      <MapPin className="h-8 w-8 text-white/20" />
      <p className="text-white/40 text-xs">{editable ? 'Set location' : ''}</p>
    </div>
  );
}

export default function MapCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [latitude, setLatitude] = useState(String(bento.latitude || ''));
  const [longitude, setLongitude] = useState(String(bento.longitude || ''));
  const [label, setLabel] = useState(bento.label ?? '');
  const [locating, setLocating] = useState(false);

  const { data: profileLink } = api.profileLink.getByLink.useQuery({
    link: params.link,
  });

  const queryClient = api.useContext();
  const { mutateAsync: updateBento } =
    api.profileLink.updateBento.useMutation();

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setLocating(false);
      },
      () => {
        setLocating(false);
      }
    );
  }, []);

  const handleSave = async () => {
    const lat = Number.parseFloat(latitude);
    const lng = Number.parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    queryClient.profileLink.getByLink.setData({ link: params.link }, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        bento: old.bento.map((b) =>
          b.id === bento.id
            ? { ...b, latitude: lat, longitude: lng, label: label || undefined }
            : b
        ),
      };
    });

    await updateBento({
      link: params.link,
      bento: {
        ...bento,
        latitude: lat,
        longitude: lng,
        label: label || undefined,
      },
    });
    setEditOpen(false);
  };

  const mdSize = bento.size.md ?? '2x2';
  const hasLocation = bento.latitude !== 0 || bento.longitude !== 0;

  return (
    <>
      <div
        className={cn(
          'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-[#1a1a2e] shadow-sm',
          editable
            ? 'transition-transform duration-200 ease-in-out md:cursor-move'
            : 'cursor-pointer transition-all duration-200 hover:shadow-md'
        )}
      >
        {editable && (
          <CardOverlay bento={bento} allowedSizes={MAP_CARD_SIZES} />
        )}

        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {hasLocation ? (
            <MapDisplay
              latitude={bento.latitude}
              longitude={bento.longitude}
              label={bento.label}
              compact={mdSize === '2x2'}
              profileImage={profileLink?.image}
              profileName={profileLink?.name}
            />
          ) : (
            <EmptyMapState editable={editable} />
          )}
        </div>

        {editable && (
          <button
            type="button"
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-full bg-white/20 p-2 text-white opacity-0 shadow backdrop-blur-sm transition-opacity group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cal">Edit Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {latitude &&
              longitude &&
              !Number.isNaN(Number(latitude)) &&
              !Number.isNaN(Number(longitude)) && (
                <div className="aspect-video overflow-hidden rounded-xl border border-border">
                  <MapDisplay
                    latitude={Number(latitude)}
                    longitude={Number(longitude)}
                    label={label}
                    profileImage={profileLink?.image}
                    profileName={profileLink?.name}
                  />
                </div>
              )}

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              disabled={locating}
              onClick={handleUseMyLocation}
            >
              <Locate className="mr-2 h-4 w-4" />
              {locating ? 'Getting location...' : 'Use my location'}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lat" className="font-medium text-sm">
                  Latitude
                </Label>
                <Input
                  id="lat"
                  placeholder="40.7128"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng" className="font-medium text-sm">
                  Longitude
                </Label>
                <Input
                  id="lng"
                  placeholder="-74.0060"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="map-label" className="font-medium text-sm">
                Label
              </Label>
              <Input
                id="map-label"
                placeholder="New York City"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button onClick={handleSave} className="w-full rounded-xl">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
