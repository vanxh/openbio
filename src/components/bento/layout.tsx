"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { type Layouts, Responsive, WidthProvider } from "react-grid-layout";

export default function BentoLayout({
  children,
  layouts,
}: {
  children: React.ReactNode;
  layouts: Layouts;
}) {
  const ResponsiveGridLayout = WidthProvider(Responsive);

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      cols={{
        xxs: 2,
        xs: 2,
        sm: 3,
        md: 4,
        lg: 4,
      }}
      breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 480, xxs: 0 }}
      rowHeight={176}
      isResizable={false}
      onLayoutChange={() => {
        // TODO
      }}
    >
      {children}
    </ResponsiveGridLayout>
  );
}
