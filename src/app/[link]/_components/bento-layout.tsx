"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { useMemo } from "react";
import {
  type Layouts,
  Responsive,
  WidthProvider,
  type ResponsiveProps,
} from "react-grid-layout";

import { api } from "@/trpc/react";
import { useParams } from "next/navigation";

export default function BentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { link } = useParams<{ link: string }>();
  const ResponsiveGridLayout = useMemo(
    () => WidthProvider(Responsive) as React.ComponentType<ResponsiveProps>,
    []
  );

  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery({
    link,
  });

  const { mutateAsync: updateBento } =
    api.profileLink.updateBento.useMutation();

  const layouts = {
    sm: [
      ...profileLink!.bento.map((b) => ({
        i: b.id,
        x: b.position.sm?.x ?? 0,
        y: b.position.sm?.y ?? 0,
        w: {
          "4x1": 2,
          "2x2": 1,
          "2x4": 1,
          "4x2": 2,
          "4x4": 2,
        }[b.size.sm ?? "2x2"],
        h: {
          "4x1": 0.5,
          "2x2": 1,
          "2x4": 2,
          "4x2": 1,
          "4x4": 2,
        }[b.size.sm ?? "2x2"],
      })),
    ],
    md: [
      ...profileLink!.bento.map((b) => ({
        i: b.id,
        x: b.position.md?.x ?? 0,
        y: b.position.md?.y ?? 0,
        w: {
          "4x1": 2,
          "2x2": 1,
          "2x4": 1,
          "4x2": 2,
          "4x4": 2,
        }[b.size.md ?? "2x2"],
        h: {
          "4x1": 0.5,
          "2x2": 1,
          "2x4": 2,
          "4x2": 1,
          "4x4": 2,
        }[b.size.md ?? "2x2"],
      })),
    ],
  };

  const onLayoutChange = (newLayouts: Layouts) => {
    for (const bento of profileLink!.bento) {
      const sm = newLayouts.sm?.find((l) => l.i === bento.id);
      const md = newLayouts.md?.find((l) => l.i === bento.id);

      const mobilePosition = sm
        ? {
            x: sm.x,
            y: sm.y,
          }
        : undefined;

      const desktopPosition = md
        ? {
            x: md.x,
            y: md.y,
          }
        : undefined;

      let update = false;

      if (
        (mobilePosition !== undefined &&
          mobilePosition.x !== bento.position.sm?.x) ||
        (desktopPosition !== undefined &&
          desktopPosition.x !== bento.position.md?.x) ||
        (mobilePosition !== undefined &&
          mobilePosition.y !== bento.position.sm?.y) ||
        (desktopPosition !== undefined &&
          desktopPosition.y !== bento.position.md?.y)
      ) {
        update = true;
      }

      if (update) {
        void updateBento({
          link: profileLink!.link,
          bento: {
            ...bento,
            position: {
              sm: mobilePosition,
              md: desktopPosition,
            },
          },
        });
      }
    }
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      cols={{
        xxs: 2,
        xs: 2,
        sm: 2,
        md: 4,
        lg: 4,
      }}
      breakpoints={{ lg: 800, md: 600, sm: 300, xs: 0, xxs: 0 }}
      rowHeight={176}
      margin={[24, 24]}
      containerPadding={[0, 0]}
      draggableHandle={
        typeof window !== "undefined" && window.outerWidth < 500
          ? ".drag-handle"
          : undefined
      }
      isResizable={false}
      isDraggable={profileLink?.isOwner}
      onLayoutChange={(newLayout, newLayouts) => {
        void onLayoutChange(newLayouts);
      }}
    >
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      {children}
    </ResponsiveGridLayout>
  );
}
