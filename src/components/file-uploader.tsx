"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  isCloudinaryClientConfigured,
  uploadFileToCloudinary,
} from "@/lib/cloudinary-client";
import type { FileAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";

const MAX_FILES = 5;
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

function formatBytes(n?: number) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({
  files,
  onChange,
  folder,
  uploadedBy,
  disabled,
  label = "Attachments",
  hint,
  readOnly,
}: {
  files: FileAttachment[];
  onChange?: (files: FileAttachment[]) => void;
  /** Ignored for unsigned presets that pin asset folder (e.g. hauser/listings) */
  folder?: string;
  uploadedBy?: string;
  disabled?: boolean;
  label?: string;
  hint?: string;
  readOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isCloudinaryClientConfigured();

  async function onPick(list: FileList | null) {
    if (!list?.length || !onChange || readOnly) return;
    setError(null);

    if (!configured) {
      setError(
        "Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (and API keys or upload preset) to .env.local."
      );
      return;
    }

    const incoming = Array.from(list);
    if (files.length + incoming.length > MAX_FILES) {
      setError(`You can upload at most ${MAX_FILES} files.`);
      return;
    }

    for (const f of incoming) {
      if (f.size > MAX_BYTES) {
        setError(`${f.name} is larger than 15MB.`);
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded: FileAttachment[] = [];
      for (const file of incoming) {
        const att = await uploadFileToCloudinary(file, {
          folder: folder || process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "hauser/listings",
          uploadedBy,
        });
        uploaded.push(att);
      }
      onChange([...files, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(publicId: string) {
    if (!onChange || readOnly) return;
    onChange(files.filter((f) => f.publicId !== publicId));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm text-stone-700">{label}</label>
        {!readOnly ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading || files.length >= MAX_FILES}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        disabled={disabled || uploading || readOnly}
        onChange={(e) => void onPick(e.target.files)}
      />

      <div
        className={cn(
          "rounded-xl border border-dashed border-purple-200 bg-purple-50/30 px-4 py-4",
          readOnly && "bg-white"
        )}
      >
        {files.length === 0 ? (
          <p className="text-center text-sm text-stone-500">
            {hint ||
              (readOnly
                ? "No files."
                : "PDF, images, docs up to 15MB each (max 5).")}
          </p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.publicId}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
              >
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-2 text-purple-800 hover:underline"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{f.name}</span>
                  {f.bytes ? (
                    <span className="shrink-0 text-xs text-stone-400">
                      {formatBytes(f.bytes)}
                    </span>
                  ) : null}
                </a>
                {!readOnly && onChange ? (
                  <button
                    type="button"
                    onClick={() => remove(f.publicId)}
                    className="rounded-md p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${f.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
