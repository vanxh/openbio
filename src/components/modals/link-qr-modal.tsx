"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Download } from "lucide-react";
import { HexColorPicker } from "react-colorful";

import { type RouterOutputs } from "@/trpc/react";
import { QRCodeSVG, getQRAsCanvas } from "@/lib/qr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function LinkQRModal({
  children,
  profileLink,
}: {
  children: React.ReactNode;
  profileLink: NonNullable<RouterOutputs["profileLink"]["getByLink"]>;
}) {
  const [open, setOpen] = useState(false);

  const { link } = useParams() as { link: string };

  const downloadRef = useRef<HTMLAnchorElement>(null);
  const [showLogo, setShowLogo] = useState(true);
  const [qrConfig, setQRCode] = useState({
    value: `https://openbio.app/${link}`,
    size: 128,
    bgColor: "#ffffff",
    fgColor: "#000000",
    level: "Q",
    includeMargin: false,
    imageSettings: {
      height: 32,
      width: 32,
      // TODO: support custom logo
      src: "https://openbio.app/openbio.png",
      excavate: true,
    },
  });

  const downloadQR = async () => {
    try {
      const canvas = await getQRAsCanvas(
        {
          ...qrConfig,
          imageSettings: showLogo ? qrConfig.imageSettings : undefined,
        },
        "image/png",
        true
      );
      (canvas as HTMLCanvasElement).toBlob((blob) => {
        const url = URL.createObjectURL(blob!);

        downloadRef.current!.href = url;
        downloadRef.current!.download = `openbio-${link}.png`;
        downloadRef.current!.click();

        URL.revokeObjectURL(url);

        toast({
          title: "Downloaded!",
          description: "The QR code has been downloaded.",
        });
      });
    } catch (e) {
      throw e;
    }
  };

  const copyToClipboard = async () => {
    try {
      const canvas = await getQRAsCanvas(
        {
          ...qrConfig,
          imageSettings: showLogo ? qrConfig.imageSettings : undefined,
        },
        "image/png",
        true
      );
      (canvas as HTMLCanvasElement).toBlob((blob) => {
        const item = new ClipboardItem({ "image/png": blob! });
        void navigator.clipboard.write([item]);
        toast({
          title: "Copied to clipboard!",
          description: "The QR code has been copied to your clipboard.",
        });
      });
    } catch (e) {
      throw e;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link QR Code</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          <div className="mx-auto rounded-lg border border-border p-4">
            <QRCodeSVG
              {...qrConfig}
              imageSettings={showLogo ? qrConfig.imageSettings : undefined}
            />
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced" className="border-b-0">
              <AccordionTrigger className="hover:no-underline">
                Advanced Options
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-y-2">
                    <Label>Show Logo?</Label>
                    <Switch
                      checked={showLogo}
                      onCheckedChange={setShowLogo}
                      disabled={!profileLink.isPremium}
                    />
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-x-2">
                      <div
                        className="flex items-center gap-x-4 overflow-hidden rounded-md border"
                        style={{
                          borderColor: qrConfig.fgColor,
                        }}
                      >
                        <Popover>
                          <PopoverTrigger>
                            <div
                              className="aspect-square h-10"
                              style={{
                                backgroundColor: qrConfig.fgColor,
                              }}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-max">
                            <HexColorPicker
                              color={qrConfig.fgColor}
                              onChange={(color) =>
                                setQRCode((prev) => ({
                                  ...prev,
                                  fgColor: color,
                                }))
                              }
                            />
                          </PopoverContent>
                        </Popover>

                        <input
                          className="border-0 caret-foreground outline-none ring-0"
                          value={qrConfig.fgColor}
                          onChange={(e) =>
                            setQRCode((prev) => ({
                              ...prev,
                              fgColor: `#${e.target.value
                                .replace("#", "")
                                .replace(/[^0-9a-fA-F]/g, "")
                                .slice(0, 6)}`,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex w-full gap-x-4">
            <Button className="w-full" onClick={() => void copyToClipboard()}>
              <Copy className="mr-2" size={16} />
              Copy
            </Button>

            <Button className="w-full" onClick={() => void downloadQR()}>
              <Download className="mr-2" size={16} />
              Download
            </Button>
          </div>
        </div>

        <a
          className="hidden"
          download={`openbio-${link}.svg`}
          ref={downloadRef}
        />
      </DialogContent>
    </Dialog>
  );
}
