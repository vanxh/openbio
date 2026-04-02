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
import { MapPin, Pencil } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof MapBentoSchema>;

export const MAP_CARD_SIZES = ['2x2', '4x2', '4x4'] as const;

function getMapEmbedUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
}

function MapEmbed({
  latitude,
  longitude,
  label,
  isBanner,
}: {
  latitude: number;
  longitude: number;
  label?: string;
  isBanner?: boolean;
}) {
  if (!latitude && !longitude) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/50">
        <MapPin className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <iframe
        title={label || 'Map'}
        src={getMapEmbedUrl(latitude, longitude)}
        className="h-full w-full border-0"
        loading="lazy"
        style={{ pointerEvents: 'none' }}
      />
      {label && !isBanner && (
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-4 py-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-white/90" />
            <p className="font-medium text-sm text-white">{label}</p>
          </div>
        </div>
      )}
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

  const queryClient = api.useContext();
  const { mutateAsync: updateBento } =
    api.profileLink.updateBento.useMutation();

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
          'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
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
            <MapEmbed
              latitude={bento.latitude}
              longitude={bento.longitude}
              label={bento.label}
              isBanner={mdSize === '4x1'}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/30">
              <MapPin className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground text-xs">
                {editable ? 'Set location' : 'No location'}
              </p>
            </div>
          )}
        </div>

        {editable && (
          <button
            type="button"
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
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
                  <MapEmbed
                    latitude={Number(latitude)}
                    longitude={Number(longitude)}
                    label={label}
                  />
                </div>
              )}

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
