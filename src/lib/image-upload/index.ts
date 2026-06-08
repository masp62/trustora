import { localProvider } from "./local";
import type { ImageProvider, UploadResult } from "./types";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "./types";

function getProvider(): ImageProvider {
  const providerName = process.env.IMAGE_PROVIDER ?? "local";

  switch (providerName) {
    case "local":
      return localProvider;
    case "cloudinary":
      throw new Error("Cloudinary provider is not yet implemented");
    default:
      throw new Error(`Unknown IMAGE_PROVIDER: ${providerName}`);
  }
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new Error(
      `Invalid file type "${file.type}". Accepted types: ${ACCEPTED_IMAGE_TYPES.join(", ")}`,
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size ${file.size} exceeds the maximum of ${MAX_FILE_SIZE_BYTES} bytes (5 MB)`,
    );
  }

  const provider = getProvider();
  return provider.upload(file);
}
