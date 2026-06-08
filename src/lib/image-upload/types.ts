export interface UploadResult {
  url: string;
}

export interface ImageProvider {
  upload(file: File): Promise<UploadResult>;
}

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES_PER_POST = 10;
export const MIN_IMAGES_PER_POST = 1;
