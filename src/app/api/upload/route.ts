import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { uploadImage } from "@/lib/image-upload";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/image-upload/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return NextResponse.json(
      { error: `Invalid file type. Accepted: ${ACCEPTED_IMAGE_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File size exceeds 5 MB limit" }, { status: 400 });
  }

  try {
    const result = await uploadImage(file);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error("Image upload failed:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
