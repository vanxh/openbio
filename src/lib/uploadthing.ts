import { generateComponents } from "@uploadthing/react";

import type { AppFileRouter } from "@/server/uploadthing";

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<AppFileRouter>();
