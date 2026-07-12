import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCloudinaryCloudName,
  isCloudinaryConfigured,
  signCloudinaryParams,
} from "@/lib/cloudinary";

const bodySchema = z.object({
  folder: z.string().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  try {
    if (!getCloudinaryCloudName()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary cloud name missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local (Dashboard → copy Cloud name, e.g. dxxxxx).",
        },
        { status: 503 }
      );
    }

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (unsigned) or CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET (signed).",
        },
        { status: 503 }
      );
    }

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const defaultFolder =
      process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "hauser/listings";
    const folder =
      parsed.data.folder?.replace(/[^a-zA-Z0-9/_-]/g, "") || defaultFolder;
    const timestamp = Math.round(Date.now() / 1000);
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Prefer unsigned preset when configured (matches hauser_preset + asset folder)
    if (uploadPreset) {
      return NextResponse.json({
        mode: "unsigned" as const,
        cloudName: getCloudinaryCloudName(),
        timestamp,
        // Preset already pins asset folder (hauser/listings); client may omit folder
        folder,
        uploadPreset,
        usePresetFolder: true,
      });
    }

    if (process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_KEY) {
      const signature = signCloudinaryParams({ folder, timestamp });
      return NextResponse.json({
        mode: "signed" as const,
        cloudName: getCloudinaryCloudName(),
        apiKey: process.env.CLOUDINARY_API_KEY,
        timestamp,
        signature,
        folder,
        usePresetFolder: false,
      });
    }

    return NextResponse.json(
      { error: "No Cloudinary credentials configured." },
      { status: 503 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
