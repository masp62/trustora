import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import type { ImageProvider, UploadResult } from "./types";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const localProvider: ImageProvider = {
  async upload(file: File): Promise<UploadResult> {
    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const filename = `${randomUUID()}${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    return { url: `/uploads/${filename}` };
  },
};
