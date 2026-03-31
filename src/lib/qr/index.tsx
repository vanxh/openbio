/**
 * @license qrcode.react
 * Copyright (c) Paul O'Shannessy
 * SPDX-License-Identifier: ISC
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { escape as htmlEscape } from 'html-escaper';
import NextImage from 'next/image';
import type React from 'react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import qrcodegen from './generator';

type Modules = ReturnType<qrcodegen.QrCode['getModules']>;
type Excavation = { x: number; y: number; w: number; h: number };

const ERROR_LEVEL_MAP: Record<string, qrcodegen.QrCode.Ecc> = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
};

type ImageSettings = {
  src: string;
  height: number;
  width: number;
  excavate: boolean;
  x?: number;
  y?: number;
};

type QRProps = {
  value: string;
  size?: number;
  // Should be a real enum, but doesn't seem to be compatible with real code.
  level?: string;
  bgColor?: string;
  fgColor?: string;
  style?: CSSProperties;
  includeMargin?: boolean;
  imageSettings?: ImageSettings;
};
type QRPropsCanvas = QRProps & React.CanvasHTMLAttributes<HTMLCanvasElement>;
type QRPropsSVG = QRProps & React.SVGProps<SVGSVGElement>;

const DEFAULT_SIZE = 128;
const DEFAULT_LEVEL = 'L';
const DEFAULT_BGCOLOR = '#FFFFFF';
const DEFAULT_FGCOLOR = '#000000';
const DEFAULT_INCLUDEMARGIN = false;

const MARGIN_SIZE = 4;

// This is *very* rough estimate of max amount of QRCode allowed to be covered.
// It is "wrong" in a lot of ways (area is a terrible way to estimate, it
// really should be number of modules covered), but if for some reason we don't
// get an explicit height or width, I'd rather default to something than throw.
const DEFAULT_IMG_SCALE = 0.1;

function generatePath(modules: Modules, margin = 0): string {
  const ops: string[] = [];
  for (let y = 0; y < modules.length; y++) {
    const row = modules[y];
    ops.push(...generateRowPath(row, y, margin));
  }
  return ops.join('');
}

function generateRowPath(row: boolean[], y: number, margin: number): string[] {
  const ops: string[] = [];
  let start: number | null = null;
  for (let x = 0; x < row.length; x++) {
    const cell = row[x];
    if (!cell && start !== null) {
      ops.push(
        `M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`
      );
      start = null;
      continue;
    }

    if (x === row.length - 1 && cell) {
      ops.push(generateLastCellOp(x, y, margin, start));
    }

    if (cell && start === null) {
      start = x;
    }
  }
  return ops;
}

function generateLastCellOp(
  x: number,
  y: number,
  margin: number,
  start: number | null
): string {
  if (start === null) {
    return `M${x + margin},${y + margin} h1v1H${x + margin}z`;
  }
  return `M${start + margin},${y + margin} h${x + 1 - start}v1H${
    start + margin
  }z`;
}

// We could just do this in generatePath, except that we want to support
// non-Path2D canvas, so we need to keep it an explicit step.
function excavateModules(modules: Modules, excavation: Excavation): Modules {
  return modules.slice().map((row, y) => {
    if (y < excavation.y || y >= excavation.y + excavation.h) {
      return row;
    }
    return row.map((cell, x) => {
      if (x < excavation.x || x >= excavation.x + excavation.w) {
        return cell;
      }
      return false;
    });
  });
}

function getImageSettings(
  cells: Modules,
  size: number,
  includeMargin: boolean,
  imageSettings?: ImageSettings
): null | {
  x: number;
  y: number;
  h: number;
  w: number;
  excavation: Excavation | null;
} {
  if (imageSettings == null) {
    return null;
  }
  const margin = includeMargin ? MARGIN_SIZE : 0;
  const numCells = cells.length + margin * 2;
  const defaultSize = Math.floor(size * DEFAULT_IMG_SCALE);
  const scale = numCells / size;
  const w = (imageSettings.width || defaultSize) * scale;
  const h = (imageSettings.height || defaultSize) * scale;
  const x =
    imageSettings.x == null
      ? cells.length / 2 - w / 2
      : imageSettings.x * scale;
  const y =
    imageSettings.y == null
      ? cells.length / 2 - h / 2
      : imageSettings.y * scale;

  let excavation: Excavation | null = null;
  if (imageSettings.excavate) {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const ceilW = Math.ceil(w + x - floorX);
    const ceilH = Math.ceil(h + y - floorY);
    excavation = { x: floorX, y: floorY, w: ceilW, h: ceilH };
  }

  return { x, y, h, w, excavation };
}

// For canvas we're going to switch our drawing mode based on whether or not
// the environment supports Path2D. We only need the constructor to be
// supported, but Edge doesn't actually support the path (string) type
// argument. Luckily it also doesn't support the addPath() method. We can
// treat that as the same thing.
const SUPPORTS_PATH2D = (() => {
  try {
    new Path2D().addPath(new Path2D());
  } catch (_e) {
    return false;
  }
  return true;
})();

export function QRCodeCanvas(props: QRPropsCanvas) {
  const {
    value,
    size = DEFAULT_SIZE,
    level = DEFAULT_LEVEL,
    bgColor = DEFAULT_BGCOLOR,
    fgColor = DEFAULT_FGCOLOR,
    includeMargin = DEFAULT_INCLUDEMARGIN,
    style,
    imageSettings,
    ...otherProps
  } = props;
  const imgSrc = imageSettings?.src;
  const _canvas = useRef<HTMLCanvasElement>(null);
  const _image = useRef<HTMLImageElement>(null);

  // We're just using this state to trigger rerenders when images load.
  const [_isImgLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    // Always update the canvas. It's cheap enough and we want to be correct
    // with the current state.
    updateCanvas(
      _canvas.current,
      _image.current,
      value,
      level,
      size,
      includeMargin,
      imageSettings,
      bgColor,
      fgColor
    );
  });

  // Ensure we mark image loaded as false here so we trigger updating the
  // canvas in our other effect.
  useEffect(() => {
    setIsImageLoaded(false);
  }, []);

  const canvasStyle = { height: size, width: size, ...style };
  let img: React.ReactElement | null = null;
  if (imgSrc != null) {
    img = (
      <NextImage
        alt="QR code"
        src={imgSrc}
        key={imgSrc}
        style={{ display: 'none' }}
        onLoad={() => {
          setIsImageLoaded(true);
        }}
        ref={_image}
        width={size}
        height={size}
      />
    );
  }
  return (
    <>
      <canvas
        style={canvasStyle}
        height={size}
        width={size}
        ref={_canvas}
        {...otherProps}
      />
      {img}
    </>
  );
}

function updateCanvas(
  canvas: HTMLCanvasElement | null,
  image: HTMLImageElement | null,
  value: string,
  level: string,
  size: number,
  includeMargin: boolean,
  imageSettings: ImageSettings | undefined,
  bgColor: string,
  fgColor: string
) {
  if (canvas == null) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { cells, numCells, margin } = prepareCells(value, level, includeMargin);
  const calculatedImageSettings = getImageSettings(
    cells,
    size,
    includeMargin,
    imageSettings
  );

  const finalCells = excavateIfNecessary(cells, image, calculatedImageSettings);

  drawToContext(
    ctx,
    finalCells,
    numCells,
    margin,
    size,
    bgColor,
    fgColor,
    image,
    calculatedImageSettings
  );
}

function prepareCells(value: string, level: string, includeMargin: boolean) {
  const cells = qrcodegen.QrCode.encodeText(
    value,
    ERROR_LEVEL_MAP[level]
  ).getModules();
  const margin = includeMargin ? MARGIN_SIZE : 0;
  const numCells = cells.length + margin * 2;
  return { cells, numCells, margin };
}

function excavateIfNecessary(
  cells: Modules,
  image: HTMLImageElement | null,
  calculatedImageSettings: ReturnType<typeof getImageSettings>
) {
  const haveImageToRender =
    calculatedImageSettings != null &&
    image !== null &&
    image.complete &&
    image.naturalHeight !== 0 &&
    image.naturalWidth !== 0;

  if (haveImageToRender && calculatedImageSettings.excavation != null) {
    return excavateModules(cells, calculatedImageSettings.excavation);
  }
  return cells;
}

function drawToContext(
  ctx: CanvasRenderingContext2D,
  cells: Modules,
  numCells: number,
  margin: number,
  size: number,
  bgColor: string,
  fgColor: string,
  image: HTMLImageElement | null,
  calculatedImageSettings: ReturnType<typeof getImageSettings>
) {
  const pixelRatio = window.devicePixelRatio || 1;
  const canvas = ctx.canvas;
  canvas.height = canvas.width = size * pixelRatio;
  const scale = (size / numCells) * pixelRatio;
  ctx.scale(scale, scale);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, numCells, numCells);

  ctx.fillStyle = fgColor;
  if (SUPPORTS_PATH2D) {
    ctx.fill(new Path2D(generatePath(cells, margin)));
  } else {
    drawCellsManually(ctx, cells, margin);
  }

  if (calculatedImageSettings && image && image.complete) {
    ctx.drawImage(
      image,
      calculatedImageSettings.x + margin,
      calculatedImageSettings.y + margin,
      calculatedImageSettings.w,
      calculatedImageSettings.h
    );
  }
}

function drawCellsManually(
  ctx: CanvasRenderingContext2D,
  cells: Modules,
  margin: number
) {
  for (let rdx = 0; rdx < cells.length; rdx++) {
    const row = cells[rdx];
    for (let cdx = 0; cdx < row.length; cdx++) {
      if (row[cdx]) {
        ctx.fillRect(cdx + margin, rdx + margin, 1, 1);
      }
    }
  }
}

export function QRCodeSVG(props: QRPropsSVG) {
  const {
    value,
    size = DEFAULT_SIZE,
    level = DEFAULT_LEVEL,
    bgColor = DEFAULT_BGCOLOR,
    fgColor = DEFAULT_FGCOLOR,
    includeMargin = DEFAULT_INCLUDEMARGIN,
    imageSettings,
    ...otherProps
  } = props;

  const {
    cells: initialCells,
    numCells,
    margin,
  } = prepareCells(value, level, includeMargin);
  let cells = initialCells;

  const calculatedImageSettings = getImageSettings(
    cells,
    size,
    includeMargin,
    imageSettings
  );

  let image: React.ReactElement | null = null;
  if (imageSettings != null && calculatedImageSettings != null) {
    if (calculatedImageSettings.excavation != null) {
      cells = excavateModules(cells, calculatedImageSettings.excavation);
    }

    image = (
      <image
        xlinkHref={imageSettings.src}
        height={calculatedImageSettings.h}
        width={calculatedImageSettings.w}
        x={calculatedImageSettings.x + margin}
        y={calculatedImageSettings.y + margin}
        preserveAspectRatio="none"
      />
    );
  }

  // Drawing strategy: instead of a rect per module, we're going to create a
  // single path for the dark modules and layer that on top of a light rect,
  // for a total of 2 DOM nodes. We pay a bit more in string concat but that's
  // way faster than DOM ops.
  // For level 1, 441 nodes -> 2
  // For level 40, 31329 -> 2
  const fgPath = generatePath(cells, margin);

  return (
    <svg
      height={size}
      width={size}
      viewBox={`0 0 ${numCells} ${numCells}`}
      {...otherProps}
    >
      <title>QR Code</title>
      <path
        fill={bgColor}
        d={`M0,0 h${numCells}v${numCells}H0z`}
        shapeRendering="crispEdges"
      />
      <path fill={fgColor} d={fgPath} shapeRendering="crispEdges" />
      {image}
    </svg>
  );
}

export function getQRAsSVGDataUri(props: QRProps) {
  const {
    value,
    size = DEFAULT_SIZE,
    level = DEFAULT_LEVEL,
    bgColor = DEFAULT_BGCOLOR,
    fgColor = DEFAULT_FGCOLOR,
    includeMargin = DEFAULT_INCLUDEMARGIN,
    imageSettings,
  } = props;

  const {
    cells: initialCells,
    numCells,
    margin,
  } = prepareCells(value, level, includeMargin);
  let cells = initialCells;

  const calculatedImageSettings = getImageSettings(
    cells,
    size,
    includeMargin,
    imageSettings
  );

  let image = '';
  if (imageSettings != null && calculatedImageSettings != null) {
    if (calculatedImageSettings.excavation != null) {
      cells = excavateModules(cells, calculatedImageSettings.excavation);
    }
    image = [
      `<image href="${htmlEscape(imageSettings.src)}"`,
      `height="${calculatedImageSettings.h}"`,
      `width="${calculatedImageSettings.w}"`,
      `x="${calculatedImageSettings.x + margin}"`,
      `y="${calculatedImageSettings.y + margin}"`,
      'preserveAspectRatio="none"></image>',
    ].join(' ');
  }
  const fgPath = generatePath(cells, margin);

  const svgData = [
    `<svg xmlns="http://www.w3.org/2000/svg" height="${size}" width="${size}" viewBox="0 0 ${numCells} ${numCells}">`,
    `<path fill="${bgColor}" d="M0,0 h${numCells}v${numCells}H0z" shapeRendering="crispEdges"></path>`,
    `<path fill="${fgColor}" d="${fgPath}" shapeRendering="crispEdges"></path>`,
    image,
    '</svg>',
  ].join('');

  return `data:image/svg+xml,${encodeURIComponent(svgData)}`;
}

function waitUntilImageLoaded(img: HTMLImageElement, src: string) {
  return new Promise((resolve) => {
    function onFinish() {
      img.onload = null;
      img.onerror = null;
      resolve(true);
    }
    img.onload = onFinish;
    img.onerror = onFinish;
    img.src = src;
    img.loading = 'eager';
  });
}

export async function getQRAsCanvas(
  props: QRProps,
  type: string,
  getCanvas?: boolean
): Promise<HTMLCanvasElement | string> {
  const {
    value,
    size = DEFAULT_SIZE,
    level = DEFAULT_LEVEL,
    bgColor = DEFAULT_BGCOLOR,
    fgColor = DEFAULT_FGCOLOR,
    includeMargin = DEFAULT_INCLUDEMARGIN,
    imageSettings,
  } = props;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const {
    cells: initialCells,
    numCells,
    margin,
  } = prepareCells(value, level, includeMargin);
  let cells = initialCells;

  const calculatedImageSettings = getImageSettings(
    cells,
    size,
    includeMargin,
    imageSettings
  );

  const image = new Image();
  image.crossOrigin = 'anonymous';
  if (calculatedImageSettings) {
    await waitUntilImageLoaded(image, imageSettings.src);
    if (calculatedImageSettings.excavation != null) {
      cells = excavateModules(cells, calculatedImageSettings.excavation);
    }
  }

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.height = canvas.width = size * pixelRatio;
  const scale = (size / numCells) * pixelRatio;
  ctx.scale(scale, scale);

  // Draw solid background, only paint dark modules.
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, numCells, numCells);

  ctx.fillStyle = fgColor;
  if (SUPPORTS_PATH2D) {
    // $FlowFixMe: Path2D c'tor doesn't support args yet.
    ctx.fill(new Path2D(generatePath(cells, margin)));
  } else {
    drawCellsManually(ctx, cells, margin);
  }

  const haveImageToRender =
    calculatedImageSettings != null &&
    image !== null &&
    image.complete &&
    image.naturalHeight !== 0 &&
    image.naturalWidth !== 0;
  if (haveImageToRender) {
    ctx.drawImage(
      image,
      calculatedImageSettings.x + margin,
      calculatedImageSettings.y + margin,
      calculatedImageSettings.w,
      calculatedImageSettings.h
    );
  }

  if (getCanvas) {
    return canvas;
  }

  const url = canvas.toDataURL(type, 1.0);
  canvas.remove();
  image.remove();
  return url;
}
