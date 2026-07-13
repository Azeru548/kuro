import type { FileAttachment } from "@/lib/types";

/** Remove undefined fields so Firestore accepts the payload. */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      out[key] = value.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? stripUndefined(item as Record<string, unknown>)
          : item
      );
    } else if (value && typeof value === "object" && !(value instanceof Date)) {
      // leave FieldValue / serverTimestamp alone — they are objects without plain keys
      const proto = Object.getPrototypeOf(value);
      if (proto === Object.prototype || proto === null) {
        out[key] = stripUndefined(value as Record<string, unknown>);
      } else {
        out[key] = value;
      }
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

export function sanitizeAttachment(file: FileAttachment): FileAttachment {
  return stripUndefined({
    name: file.name,
    url: file.url,
    publicId: file.publicId,
    bytes: file.bytes,
    format: file.format,
    resourceType: file.resourceType,
    uploadedAt: file.uploadedAt,
    uploadedBy: file.uploadedBy,
  }) as FileAttachment;
}

export function sanitizeAttachments(files: FileAttachment[] = []): FileAttachment[] {
  return files.map(sanitizeAttachment);
}
