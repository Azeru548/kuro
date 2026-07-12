import type { FileAttachment } from "@/lib/types";

export function isCloudinaryClientConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
}

type SignResponse = {
  cloudName: string;
  apiKey?: string;
  timestamp: number;
  signature?: string;
  folder: string;
  uploadPreset?: string;
  mode: "signed" | "unsigned";
};

export async function uploadFileToCloudinary(
  file: File,
  options: {
    folder: string;
    uploadedBy?: string;
  }
): Promise<FileAttachment> {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      "Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env.local."
    );
  }

  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: options.folder }),
  });

  const signJson = (await signRes.json()) as SignResponse & { error?: string };
  if (!signRes.ok) {
    throw new Error(signJson.error || "Failed to prepare Cloudinary upload.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("folder", signJson.folder);

  if (signJson.mode === "unsigned" && signJson.uploadPreset) {
    form.append("upload_preset", signJson.uploadPreset);
  } else if (signJson.signature && signJson.apiKey) {
    form.append("api_key", signJson.apiKey);
    form.append("timestamp", String(signJson.timestamp));
    form.append("signature", signJson.signature);
  } else {
    throw new Error(
      "Cloudinary needs either CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
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

  return {
    name: file.name,
    url: data.secure_url as string,
    publicId: data.public_id as string,
    bytes: data.bytes as number | undefined,
    format: data.format as string | undefined,
    resourceType: data.resource_type as string | undefined,
    uploadedAt: new Date().toISOString(),
    uploadedBy: options.uploadedBy,
  };
}
