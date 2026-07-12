import { createHash } from "crypto";
import type { FileAttachment } from "@/lib/types";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      (process.env.CLOUDINARY_API_SECRET ||
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)
  );
}

export function getCloudinaryCloudName() {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
}

export function getCloudinaryUploadUrl(resourceType: "auto" | "image" | "raw" = "auto") {
  const cloud = getCloudinaryCloudName();
  return `https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/upload`;
}

/** Sign params for authenticated uploads (server-only). */
export function signCloudinaryParams(params: Record<string, string | number>) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    throw new Error("CLOUDINARY_API_SECRET is not configured");
  }

  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  return createHash("sha1").update(toSign + secret).digest("hex");
}

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  bytes?: number;
  format?: string;
  resource_type?: string;
  original_filename?: string;
};

export function toFileAttachment(
  result: CloudinaryUploadResult,
  originalName?: string,
  uploadedBy?: string
): FileAttachment {
  return {
    name:
      originalName ||
      result.original_filename ||
      result.public_id.split("/").pop() ||
      "file",
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
    format: result.format,
    resourceType: result.resource_type,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };
}
