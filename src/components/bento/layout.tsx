"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { useMemo } from "react";
import { type Layouts, Responsive, WidthProvider } from "react-grid-layout";

import { api } from "@/trpc/client";
import useSSR from "@/hooks/use-ssr";

export default function BentoLayout({
  children,
  profileLink,
}: {
  children: React.ReactNode;
  profileLink: Awaited<ReturnType<typeof api.profileLink.getProfileLink.query>>;
}) {
  const { isSSR } = useSSR();

  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), []);

  const layouts = {
    sm: profileLink.Bento.map((b) => ({
      i: b.id,
      x: b.mobilePosition?.x ?? 0,
      y: b.mobilePosition?.y ?? 0,
      w: {
        SIZE_1x4: 2,
        SIZE_2x2: 1,
        SIZE_2x4: 1,
        SIZE_4x2: 2,
        SIZE_4x4: 2,
      }[b.mobileSize],
      h: {
        SIZE_1x4: 0.5,
        SIZE_2x2: 1,
        SIZE_2x4: 1,
        SIZE_4x2: 2,
        SIZE_4x4: 2,
      }[b.mobileSize],
    })),
    md: profileLink.Bento.map((b) => ({
      i: b.id,
      x: b.desktopPosition?.x ?? 0,
      y: b.desktopPosition?.y ?? 0,
      w: {
        SIZE_1x4: 2,
        SIZE_2x2: 1,
        SIZE_2x4: 1,
        SIZE_4x2: 2,
        SIZE_4x4: 2,
      }[b.desktopSize],
      h: {
        SIZE_1x4: 0.5,
        SIZE_2x2: 1,
        SIZE_2x4: 1,
        SIZE_4x2: 2,
        SIZE_4x4: 2,
      }[b.desktopSize],
    })),
  };

  const onLayoutChange = async (newLayouts: Layouts) => {
    for (const bento of profileLink.Bento) {
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
          mobilePosition.x !== bento.mobilePosition?.x) ||
        (desktopPosition !== undefined &&
          desktopPosition.x !== bento.desktopPosition?.x) ||
        (mobilePosition !== undefined &&
          mobilePosition.y !== bento.mobilePosition?.y) ||
        (desktopPosition !== undefined &&
          desktopPosition.y !== bento.desktopPosition?.y)
      ) {
        console.log("OLD X", bento.mobilePosition?.x, bento.desktopPosition?.x);
        console.log("NEW X", mobilePosition?.x, desktopPosition?.x);

        console.log("OLD Y", bento.mobilePosition?.y, bento.desktopPosition?.y);
        console.log("NEW Y", mobilePosition?.y, desktopPosition?.y);
        update = true;
      }

      if (update) {
        await api.profileLink.updateProfileLinkBento.mutate({
          id: bento.id,
          mobilePosition,
          desktopPosition,
        });
      }
    }
  };

  if (isSSR) return null;

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
      draggableHandle={window.outerWidth < 500 ? ".drag-handle" : undefined}
      isResizable={false}
      onLayoutChange={(newLayout, newLayouts) => {
        void onLayoutChange(newLayouts);
      }}
    >
      {children}
    </ResponsiveGridLayout>
  );
}
