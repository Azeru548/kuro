import type { FileAttachment } from "@/lib/types";

export function isCloudinaryClientConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || true)
  );
}

type SignResponse = {
  cloudName: string;
  apiKey?: string;
  timestamp: number;
  signature?: string;
  folder: string;
  uploadPreset?: string;
  mode: "signed" | "unsigned";
  usePresetFolder?: boolean;
};

export async function uploadFileToCloudinary(
  file: File,
  options: {
    folder?: string;
    uploadedBy?: string;
  } = {}
): Promise<FileAttachment> {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      "Cloudinary cloud name missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local."
    );
  }

  const defaultFolder =
    process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "hauser/listings";

  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder: options.folder || defaultFolder,
    }),
  });

  const signJson = (await signRes.json()) as SignResponse & { error?: string };
  if (!signRes.ok) {
    throw new Error(signJson.error || "Failed to prepare Cloudinary upload.");
  }

  const form = new FormData();
  form.append("file", file);

  if (signJson.mode === "unsigned" && signJson.uploadPreset) {
    // Unsigned preset: asset folder comes from preset (hauser/listings)
    form.append("upload_preset", signJson.uploadPreset);
    // Do not force folder/public_id — preset has use_filename=false, unique_filename=false
  } else if (signJson.signature && signJson.apiKey) {
    form.append("api_key", signJson.apiKey);
    form.append("timestamp", String(signJson.timestamp));
    form.append("signature", signJson.signature);
    form.append("folder", signJson.folder);
  } else {
    throw new Error(
      "Cloudinary needs NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET or API key + secret."
    );
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signJson.cloudName}/auto/upload`;
  const uploadRes = await fetch(uploadUrl, { method: "POST", body: form });
  const data = await uploadRes.json();

  if (!uploadRes.ok) {
    throw new Error(
      data?.error?.message || data?.message || "Cloudinary upload failed."
    );
  }

  const attachment: FileAttachment = {
    name: file.name || String(data.original_filename || data.public_id || "file"),
    url: String(data.secure_url),
    publicId: String(data.public_id),
    uploadedAt: new Date().toISOString(),
  };

  if (typeof data.bytes === "number") attachment.bytes = data.bytes;
  if (typeof data.format === "string") attachment.format = data.format;
  if (typeof data.resource_type === "string") {
    attachment.resourceType = data.resource_type;
  }
  if (options.uploadedBy) attachment.uploadedBy = options.uploadedBy;

  return attachment;
}
