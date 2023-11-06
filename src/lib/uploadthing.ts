import { generateComponents } from "@uploadthing/react";
import { generateReactHelpers } from "@uploadthing/react/hooks";
import type { AppFileRouter } from "@/server/uploadthing";

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<AppFileRouter>();

export const { uploadFiles, useUploadThing } =
  generateReactHelpers<AppFileRouter>();
