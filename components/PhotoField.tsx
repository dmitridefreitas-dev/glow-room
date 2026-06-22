"use client";

import { useRef, useState } from "react";

/**
 * Downscale + re-encode an image in the browser before it's uploaded, so a
 * multi-megabyte phone photo doesn't (a) blow past the Server Action body limit
 * or (b) hit Vercel's ~4.5MB request cap. Falls back to the original file if the
 * browser can't decode it (e.g. some HEIC in Chrome).
 */
async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file; // never upsize
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file; // can't decode it here — let the server take the original
  }
}

export function PhotoField({
  name = "photo",
  savedPhotoUrl = null,
  day,
}: {
  name?: string;
  savedPhotoUrl?: string | null;
  day: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(savedPhotoUrl);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      // Swap the input's file for the compressed one so the form submits that.
      const dt = new DataTransfer();
      dt.items.add(compressed);
      if (inputRef.current) inputRef.current.files = dt.files;
      setPreview(URL.createObjectURL(compressed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={`Your Day ${day} photo`}
          className="mt-2 max-h-72 rounded-xl border border-line"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        onChange={onChange}
        className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-spruce file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ivory"
      />
      {busy && (
        <p className="mt-1 text-xs text-muted">Optimizing your photo…</p>
      )}
    </div>
  );
}
